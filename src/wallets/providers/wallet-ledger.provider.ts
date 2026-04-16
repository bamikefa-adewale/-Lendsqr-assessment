import { randomUUID } from 'crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../../database/database.constants';
import { FundWalletResult } from '../interfaces/fund-wallet-result.interface';
import { WalletRow } from '../interfaces/wallet-row.interface';

export type WalletMutation = {
  nextBalance: number;
  transactionType: 'fund' | 'withdraw';
};

@Injectable()
export class WalletLedgerProvider {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  // this method runs an atomic wallet balance operation and logs it
  async executeWalletBalanceOperation({
    userId,
    amount,
    description,
    mutate,
  }: {
    userId: string;
    amount: number;
    description?: string;
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

      const previousBalance = Number(lockedWallet.balance);
      const { nextBalance, transactionType } = mutate(lockedWallet, amount);
      const transactionReference = randomUUID();

      await this.updateWalletBalance(trx, lockedWallet.id, nextBalance);
      await this.insertTransaction(trx, {
        wallet_id: lockedWallet.id,
        type: transactionType,
        amount,
        status: 'success',
        reference: transactionReference,
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

  async insertTransaction(
    trx: Knex.Transaction,
    payload: {
      wallet_id: string;
      type: 'fund' | 'withdraw' | 'transfer_in' | 'transfer_out';
      amount: number;
      status: 'pending' | 'success' | 'failed';
      reference: string;
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
