import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class TransferWalletDto {
  @ApiProperty({
    example: '2ec67438-ff0e-40be-ba72-85356638df6d',
    description: 'Recipient user id',
  })
  @IsUUID()
  recipientUserId!: string;

  @ApiProperty({ example: 750, minimum: 0.01 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: 'Loan repayment transfer' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
