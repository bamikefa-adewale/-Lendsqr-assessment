import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class WithdrawWalletDto {
  @ApiProperty({ example: 2000, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 'ATM cashout' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
