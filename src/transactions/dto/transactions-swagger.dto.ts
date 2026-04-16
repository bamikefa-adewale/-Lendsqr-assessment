import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../enums/transaction-type.enum';

export class TransactionSwaggerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  wallet_id: string;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: ['pending', 'success', 'failed'] })
  status: 'pending' | 'success' | 'failed';

  @ApiProperty()
  reference: string;

  @ApiProperty({ nullable: true })
  related_wallet_id: string | null;

  @ApiProperty({ nullable: true })
  group_id: string | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  created_at: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updated_at: Date;
}

export class TransactionsMetaSwaggerDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}

export class ListTransactionsSuccessSwaggerDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Transactions fetched successfully' })
  message: string;

  @ApiProperty({ type: [TransactionSwaggerDto] })
  data: TransactionSwaggerDto[];

  @ApiProperty({ type: TransactionsMetaSwaggerDto })
  meta: TransactionsMetaSwaggerDto;
}

export class GetTransactionSuccessSwaggerDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Transaction fetched successfully' })
  message: string;

  @ApiProperty({ type: TransactionSwaggerDto })
  data: TransactionSwaggerDto;
}

