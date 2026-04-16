export interface TransferWalletResult {
  transferGroupId: string;
  sender: {
    walletId: string;
    previousBalance: number;
    currentBalance: number;
    transactionReference: string;
  };
  recipient: {
    walletId: string;
    previousBalance: number;
    currentBalance: number;
    transactionReference: string;
  };
}
