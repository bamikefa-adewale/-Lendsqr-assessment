import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class FundWalletDto {
  @ApiProperty({ example: 5000.5, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 'Wallet top up via card' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
