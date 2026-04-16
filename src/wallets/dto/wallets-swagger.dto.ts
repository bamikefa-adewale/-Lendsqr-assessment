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

export class ErrorResponseSwaggerDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    oneOf: [
      { type: 'string', example: 'Validation failed' },
      {
        type: 'array',
        items: { type: 'string' },
        example: ['amount must not be less than 0.01'],
      },
    ],
  })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}
