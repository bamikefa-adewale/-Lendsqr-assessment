import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../database/database.constants';
import { ServiceErrorHandlerProvider } from '../filters/service-error-handler.provider';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import { TransactionRow } from './interfaces/transaction-row.interface';

@Injectable()
export class TransactionsService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly serviceErrorHandler: ServiceErrorHandlerProvider,
  ) {}

  async getAllUserTransactions(userId: string, query: ListTransactionsQueryDto) {
    try {
      const { page, limit, status, type } = query;
      const offset = (page - 1) * limit;

      const baseQuery = this.knex<TransactionRow>('transactions')
        .join('wallets', 'transactions.wallet_id', 'wallets.id')
        .where('wallets.user_id', userId)
        .modify((qb) => {
          if (type) qb.where('transactions.type', type);
          if (status) qb.where('transactions.status', status);
        });

      const countRow = await baseQuery
        .clone()
        .clearSelect()
        .clearOrder()
        .count<{ count: string }>({ count: 'transactions.id' })
        .first();

      const total = Number(countRow?.count ?? 0);
      const data = await baseQuery
        .clone()
        .select('transactions.*')
        .orderBy('transactions.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      return {
        data,
        meta: {
          page,
          limit,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.serviceErrorHandler.handleServiceError('fetch user transactions', error);
    }
  }

  async getUserTransactionByReference(userId: string, reference: string) {
    try {
      const transaction = await this.knex<TransactionRow>('transactions')
        .join('wallets', 'transactions.wallet_id', 'wallets.id')
        .where('wallets.user_id', userId)
        .andWhere('transactions.reference', reference)
        .select('transactions.*')
        .first();

      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }

      return transaction;
    } catch (error) {
      this.serviceErrorHandler.handleServiceError('fetch transaction by reference', error);
    }
  }
}
