import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';
import { TransactionType } from '../enums/transaction-type.enum';

const transactionStatuses = ['pending', 'success', 'failed'] as const;

export class ListTransactionsQueryDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsIn(Object.values(TransactionType))
  type?: TransactionType;

  @ApiPropertyOptional({ enum: transactionStatuses })
  @IsOptional()
  @IsIn(transactionStatuses)
  status?: (typeof transactionStatuses)[number];

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
