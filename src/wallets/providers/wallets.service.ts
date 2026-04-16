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
  ): Promise<FundWalletResult> {
    try {
      this.walletValidation.ensureAmountIsValid(amount);

      return this.walletLedger.executeWalletBalanceOperation({
        userId,
        amount,
        description,
        mutate: (wallet, value) => {
          this.walletValidation.ensureWalletIsActive(wallet);
          return {
            nextBalance: Number(wallet.balance) + value,
            transactionType: 'fund',
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
  ): Promise<WithdrawWalletResult> {
    try {
      this.walletValidation.ensureAmountIsValid(amount);

      return this.walletLedger.executeWalletBalanceOperation({
        userId,
        amount,
        description,
        mutate: (wallet, value) => {
          this.walletValidation.ensureWalletIsActive(wallet);

          const balance = Number(wallet.balance);
          if (balance < value) {
            throw new BadRequestException('Insufficient wallet balance');
          }

          return {
            nextBalance: balance - value,
            transactionType: 'withdraw',
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
  ): Promise<TransferWalletResult> {
    try {
      this.walletValidation.ensureAmountIsValid(amount);
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
          type: 'transfer_out',
          amount,
          status: 'success',
          reference: transferOutReference,
          group_id: transferGroupId,
          description: description?.trim() || null,
        });

        await this.walletLedger.insertTransaction(trx, {
          wallet_id: recipientWallet.id,
          related_wallet_id: senderWallet.id,
          type: 'transfer_in',
          amount,
          status: 'success',
          reference: transferInReference,
          group_id: transferGroupId,
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
}
