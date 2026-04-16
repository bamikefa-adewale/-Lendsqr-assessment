import { TransactionType } from '../enums/transaction-type.enum';

export interface TransactionRow {
  id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  reference: string;
  related_wallet_id: string | null;
  group_id: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}
