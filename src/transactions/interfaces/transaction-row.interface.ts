import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export interface TransactionRow {
  id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  reference: string;
  idempotency_key: string | null;
  related_wallet_id: string | null;
  group_id: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
