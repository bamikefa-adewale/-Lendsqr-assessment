import { randomUUID } from 'crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../database/database.constants';
import { FundWalletResult } from '../interfaces/fund-wallet-result.interface';
import { WalletRow } from '../interfaces/wallet-row.interface';
import { TransactionRow } from '../../transactions/interfaces/transaction-row.interface';
import { TransactionType } from '../../transactions/enums/transaction-type.enum';
import { TransactionStatus } from '../../transactions/enums/transaction-status.enum';

export type WalletMutation = {
  nextBalance: number;
  transactionType: TransactionType.FUND | TransactionType.WITHDRAW;
};

@Injectable()
export class WalletLedgerProvider {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  // this method runs an atomic wallet balance operation and logs it
  async executeWalletBalanceOperation({
    userId,
    amount,
    description,
    idempotencyKey,
    mutate,
  }: {
    userId: string;
    amount: number;
    description?: string;
    idempotencyKey: string;
    mutate: (wallet: WalletRow, amount: number) => WalletMutation;
  }): Promise<FundWalletResult> {
    return this.knex.transaction(async (trx) => {
      const lockedWallet = await trx<WalletRow>('wallets')
        .where({ user_id: userId })
        .forUpdate()
        .first();

      if (!lockedWallet) {
        throw new NotFoundException('Wallet not found for user');
      }

      const { nextBalance, transactionType } = mutate(lockedWallet, amount);
      const existingTransaction =
        await this.findWalletTransactionByIdempotencyKey(
          trx,
          lockedWallet.id,
          transactionType,
          idempotencyKey,
        );

      if (existingTransaction) {
        const existingAmount = Number(existingTransaction.amount);
        const currentBalance = Number(lockedWallet.balance);
        const previousBalance =
          existingTransaction.type === TransactionType.FUND
            ? currentBalance - existingAmount
            : currentBalance + existingAmount;
        return {
          walletId: lockedWallet.id,
          previousBalance,
          currentBalance,
          transactionReference: existingTransaction.reference,
        };
      }

      const previousBalance = Number(lockedWallet.balance);
      const transactionReference = randomUUID();

      await this.updateWalletBalance(trx, lockedWallet.id, nextBalance);
      await this.insertTransaction(trx, {
        wallet_id: lockedWallet.id,
        type: transactionType,
        amount,
        status: TransactionStatus.SUCCESS,
        reference: transactionReference,
        idempotency_key: idempotencyKey,
        description: description?.trim() || null,
      });

      return {
        walletId: lockedWallet.id,
        previousBalance,
        currentBalance: nextBalance,
        transactionReference,
      };
    });
  }

  // this method locks a wallet row for update by user id
  async lockWalletByUserIdForUpdate(
    trx: Knex.Transaction,
    userId: string,
  ): Promise<WalletRow | undefined> {
    return trx<WalletRow>('wallets')
      .where({ user_id: userId })
      .forUpdate()
      .first();
  }

  async updateWalletBalance(
    trx: Knex.Transaction,
    walletId: string,
    balance: number,
  ): Promise<void> {
    await trx('wallets').where({ id: walletId }).update({
      balance,
      last_transaction_at: trx.fn.now(),
      updated_at: trx.fn.now(),
    });
  }

  async findWalletTransactionByIdempotencyKey(
    trx: Knex.Transaction,
    walletId: string,
    type: TransactionType,
    idempotencyKey: string,
  ): Promise<TransactionRow | undefined> {
    return trx<TransactionRow>('transactions')
      .where({
        wallet_id: walletId,
        type,
        idempotency_key: idempotencyKey,
      })
      .first();
  }

  async findTransferInByGroupId(
    trx: Knex.Transaction,
    groupId: string,
  ): Promise<TransactionRow | undefined> {
    return trx<TransactionRow>('transactions')
      .where({
        group_id: groupId,
        type: TransactionType.TRANSFER_IN,
      })
      .first();
  }

  async insertTransaction(
    trx: Knex.Transaction,
    payload: {
      wallet_id: string;
      type: TransactionType;
      amount: number;
      status: TransactionStatus;
      reference: string;
      idempotency_key?: string;
      description?: string | null;
      related_wallet_id?: string;
      group_id?: string;
    },
  ): Promise<void> {
    await trx('transactions').insert({
      id: randomUUID(),
      ...payload,
    });
  }
}
