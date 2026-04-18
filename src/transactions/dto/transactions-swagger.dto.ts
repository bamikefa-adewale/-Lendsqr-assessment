import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../enums/transaction-type.enum';
import { TransactionStatus } from '../enums/transaction-status.enum';

export class TransactionSwaggerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  wallet_id: string;

  @ApiProperty({ enum: TransactionType })
  type: TransactionType;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty()
  reference: string;

  @ApiProperty({ nullable: true })
  idempotency_key: string | null;

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

export class ListTransactionsDataSwaggerDto {
  @ApiProperty({ type: [TransactionSwaggerDto] })
  items: TransactionSwaggerDto[];

  @ApiProperty({ type: TransactionsMetaSwaggerDto })
  meta: TransactionsMetaSwaggerDto;
}

export class ListTransactionsSuccessSwaggerDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Transactions fetched successfully' })
  message: string;

  @ApiProperty({ type: ListTransactionsDataSwaggerDto })
  data: ListTransactionsDataSwaggerDto;
}

export class GetTransactionSuccessSwaggerDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Transaction fetched successfully' })
  message: string;

  @ApiProperty({ type: TransactionSwaggerDto })
  data: TransactionSwaggerDto;
}

