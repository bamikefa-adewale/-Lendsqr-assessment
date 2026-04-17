import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { ServiceErrorHandlerProvider } from '../../filters/service-error-handler.provider';
import { KNEX_CONNECTION } from '../../database/database.constants';
import { FundWalletResult } from '../interfaces/fund-wallet-result.interface';
import { WalletRow } from '../interfaces/wallet-row.interface';
import { WithdrawWalletResult } from '../interfaces/withdraw-wallet-result.interface';
import { TransferWalletResult } from '../interfaces/transfer-wallet-result.interface';
import { WalletLedgerProvider } from './wallet-ledger.provider';
import { WalletValidationProvider } from './wallet-validation.provider';
import { TransactionRow } from '../../transactions/interfaces/transaction-row.interface';
import { TransactionType } from '../../transactions/enums/transaction-type.enum';
import { TransactionStatus } from '../../transactions/enums/transaction-status.enum';

@Injectable()
export class WalletsService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly walletLedger: WalletLedgerProvider,
    private readonly walletValidation: WalletValidationProvider,
    private readonly serviceErrorHandler: ServiceErrorHandlerProvider,
  ) {}

  //this method will create a wallet for a user  in the database
  async createWalletForUser(
    userId: string,
    trx?: Knex.Transaction,
  ): Promise<WalletRow> {
    try {
      const db = trx ?? this.knex;
      const walletId = randomUUID();
      await db('wallets').insert({
        id: walletId,
        user_id: userId,
        balance: 0,
      });

      const wallet = await db<WalletRow>('wallets')
        .where({ id: walletId })
        .first();
      if (!wallet) {
        throw new Error('Wallet was not found after create');
      }
      return wallet;
    } catch (error) {
      this.serviceErrorHandler.handleServiceError('create wallet', error);
    }
  }

  // this method will fund a wallet for a user
  async fundWallet(
    userId: string,
    amount: number,
    description?: string,
    idempotencyKey?: string,
  ): Promise<FundWalletResult> {
    try {
      this.walletValidation.ensureAmountIsValid(amount);
      const safeIdempotencyKey = this.ensureIdempotencyKey(idempotencyKey);

      return this.walletLedger.executeWalletBalanceOperation({
        userId,
        amount,
        description,
        idempotencyKey: safeIdempotencyKey,
        mutate: (wallet, value) => {
          this.walletValidation.ensureWalletIsActive(wallet);
          return {
            nextBalance: Number(wallet.balance) + value,
            transactionType: TransactionType.FUND,
          };
        },
      });
    } catch (error) {
      this.serviceErrorHandler.handleServiceError('fund wallet', error);
    }
  }

  // this method will withdraw a money from a user's wallet
  async withdrawWallet(
    userId: string,
    amount: number,
    description?: string,
    idempotencyKey?: string,
  ): Promise<WithdrawWalletResult> {
    try {
      this.walletValidation.ensureAmountIsValid(amount);
      const safeIdempotencyKey = this.ensureIdempotencyKey(idempotencyKey);

      return this.walletLedger.executeWalletBalanceOperation({
        userId,
        amount,
        description,
        idempotencyKey: safeIdempotencyKey,
        mutate: (wallet, value) => {
          this.walletValidation.ensureWalletIsActive(wallet);

          const balance = Number(wallet.balance);
          if (balance < value) {
            throw new BadRequestException('Insufficient wallet balance');
          }

          return {
            nextBalance: balance - value,
            transactionType: TransactionType.WITHDRAW,
          };
        },
      });
    } catch (error) {
      this.serviceErrorHandler.handleServiceError('withdraw wallet', error);
    }
  }

  // this method will transfer a money from a user's wallet to another user's wallet
  async transferWallet(
    userId: string,
    recipientUserId: string,
    amount: number,
    description?: string,
    idempotencyKey?: string,
  ): Promise<TransferWalletResult> {
    try {
      this.walletValidation.ensureAmountIsValid(amount);
      const safeIdempotencyKey = this.ensureIdempotencyKey(idempotencyKey);
      if (!recipientUserId?.trim()) {
        throw new BadRequestException('Recipient user id is required');
      }
      if (userId === recipientUserId) {
        throw new BadRequestException('Cannot transfer to same user');
      }

      return this.knex.transaction(async (trx) => {
        const senderWallet =
          await this.walletLedger.lockWalletByUserIdForUpdate(trx, userId);
        const recipientWallet =
          await this.walletLedger.lockWalletByUserIdForUpdate(
            trx,
            recipientUserId,
          );

        if (!senderWallet) {
          throw new NotFoundException('Wallet not found for user');
        }

        if (!recipientWallet) {
          throw new NotFoundException('Recipient wallet not found');
        }

        this.walletValidation.ensureWalletIsActive(senderWallet);
        this.walletValidation.ensureWalletIsActive(recipientWallet);

        const existingTransferOut =
          await this.walletLedger.findWalletTransactionByIdempotencyKey(
            trx,
            senderWallet.id,
            TransactionType.TRANSFER_OUT,
            safeIdempotencyKey,
          );

        if (existingTransferOut) {
          return this.buildIdempotentTransferResult(
            trx,
            senderWallet,
            recipientWallet,
            existingTransferOut,
          );
        }

        const senderPreviousBalance = Number(senderWallet.balance);
        const recipientPreviousBalance = Number(recipientWallet.balance);

        if (senderPreviousBalance < amount) {
          throw new BadRequestException('Insufficient wallet balance');
        }

        const senderCurrentBalance = senderPreviousBalance - amount;
        const recipientCurrentBalance = recipientPreviousBalance + amount;
        const transferGroupId = randomUUID();
        const transferOutReference = randomUUID();
        const transferInReference = randomUUID();

        await this.walletLedger.updateWalletBalance(
          trx,
          senderWallet.id,
          senderCurrentBalance,
        );
        await this.walletLedger.updateWalletBalance(
          trx,
          recipientWallet.id,
          recipientCurrentBalance,
        );

        await this.walletLedger.insertTransaction(trx, {
          wallet_id: senderWallet.id,
          related_wallet_id: recipientWallet.id,
          type: TransactionType.TRANSFER_OUT,
          amount,
          status: TransactionStatus.SUCCESS,
          reference: transferOutReference,
          group_id: transferGroupId,
          idempotency_key: safeIdempotencyKey,
          description: description?.trim() || null,
        });

        await this.walletLedger.insertTransaction(trx, {
          wallet_id: recipientWallet.id,
          related_wallet_id: senderWallet.id,
          type: TransactionType.TRANSFER_IN,
          amount,
          status: TransactionStatus.SUCCESS,
          reference: transferInReference,
          group_id: transferGroupId,
          idempotency_key: safeIdempotencyKey,
          description: description?.trim() || null,
        });

        return {
          transferGroupId,
          sender: {
            walletId: senderWallet.id,
            previousBalance: senderPreviousBalance,
            currentBalance: senderCurrentBalance,
            transactionReference: transferOutReference,
          },
          recipient: {
            walletId: recipientWallet.id,
            previousBalance: recipientPreviousBalance,
            currentBalance: recipientCurrentBalance,
            transactionReference: transferInReference,
          },
        };
      });
    } catch (error) {
      this.serviceErrorHandler.handleServiceError('transfer wallet', error);
    }
  }

  private ensureIdempotencyKey(idempotencyKey?: string): string {
    const normalized = idempotencyKey?.trim();
    if (!normalized) {
      throw new BadRequestException('Idempotency key is required');
    }
    return normalized;
  }

  private async buildIdempotentTransferResult(
    trx: Knex.Transaction,
    senderWallet: WalletRow,
    recipientWallet: WalletRow,
    transferOut: TransactionRow,
  ): Promise<TransferWalletResult> {
    const transferIn = await this.walletLedger.findTransferInByGroupId(
      trx,
      transferOut.group_id ?? '',
    );

    if (!transferOut.group_id || !transferIn) {
      throw new BadRequestException('Transfer idempotency record is incomplete');
    }

    const amount = Number(transferOut.amount);
    const senderCurrentBalance = Number(senderWallet.balance);
    const recipientCurrentBalance = Number(recipientWallet.balance);

    return {
      transferGroupId: transferOut.group_id,
      sender: {
        walletId: senderWallet.id,
        previousBalance: senderCurrentBalance + amount,
        currentBalance: senderCurrentBalance,
        transactionReference: transferOut.reference,
      },
      recipient: {
        walletId: recipientWallet.id,
        previousBalance: recipientCurrentBalance - amount,
        currentBalance: recipientCurrentBalance,
        transactionReference: transferIn.reference,
      },
    };
  }
}
