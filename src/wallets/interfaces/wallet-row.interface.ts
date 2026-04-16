export interface WalletRow {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: 'active' | 'frozen' | 'closed';
  version: number;
  last_transaction_at: Date | null;
  created_at: Date;
  updated_at: Date;
}
