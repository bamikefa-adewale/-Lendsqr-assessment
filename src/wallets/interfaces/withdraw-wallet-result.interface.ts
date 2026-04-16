export interface WithdrawWalletResult {
  walletId: string;
  previousBalance: number;
  currentBalance: number;
  transactionReference: string;
}
