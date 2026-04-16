import { ApiProperty } from '@nestjs/swagger';

export class WalletBalanceOperationDataSwaggerDto {
  @ApiProperty()
  walletId: string;

  @ApiProperty()
  previousBalance: number;

  @ApiProperty()
  currentBalance: number;

  @ApiProperty()
  transactionReference: string;
}

export class TransferPartyDataSwaggerDto {
  @ApiProperty()
  walletId: string;

  @ApiProperty()
  previousBalance: number;

  @ApiProperty()
  currentBalance: number;

  @ApiProperty()
  transactionReference: string;
}

export class FundWalletSuccessSwaggerDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Wallet funded successfully' })
  message: string;

  @ApiProperty({ type: WalletBalanceOperationDataSwaggerDto })
  data: WalletBalanceOperationDataSwaggerDto;
}

export class WithdrawWalletSuccessSwaggerDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Wallet withdrawn successfully' })
  message: string;

  @ApiProperty({ type: WalletBalanceOperationDataSwaggerDto })
  data: WalletBalanceOperationDataSwaggerDto;
}

export class TransferWalletDataSwaggerDto {
  @ApiProperty()
  transferGroupId: string;

  @ApiProperty({ type: TransferPartyDataSwaggerDto })
  sender: TransferPartyDataSwaggerDto;

  @ApiProperty({ type: TransferPartyDataSwaggerDto })
  recipient: TransferPartyDataSwaggerDto;
}

export class TransferWalletSuccessSwaggerDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Transfer completed successfully' })
  message: string;

  @ApiProperty({ type: TransferWalletDataSwaggerDto })
  data: TransferWalletDataSwaggerDto;
}

