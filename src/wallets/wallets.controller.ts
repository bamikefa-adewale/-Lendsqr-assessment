import { Body, Controller, Logger, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GetUserId } from '../auth/decorators/user.decorator';
import { Auth } from '../auth/decorators/auth.decorators';
import { AuthType } from '../auth/enums/auth-types.enum';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { TransferWalletDto } from './dto/transfer-wallet.dto';
import { WithdrawWalletDto } from './dto/withdraw-wallet.dto';
import {
  FundWalletSuccessSwaggerDto,
  TransferWalletSuccessSwaggerDto,
  WithdrawWalletSuccessSwaggerDto,
} from './dto/wallets-swagger.dto';
import { ErrorResponseSwaggerDto } from '../common/dto/error-response-swagger.dto';
import { WalletsService } from './providers/wallets.service';

@ApiTags('wallets')
@ApiBearerAuth()
@Controller('wallets')
export class WalletsController {
  private readonly logger = new Logger(WalletsController.name);

  constructor(private readonly walletsService: WalletsService) {}

  @Post('fund')
  @Auth(AuthType.Bearer)
  @ApiOperation({
    summary: 'Fund wallet',
    description: 'Adds money to the authenticated user wallet balance.',
  })
  @ApiBody({ type: FundWalletDto })
  @ApiOkResponse({
    description: 'Wallet funded successfully',
    type: FundWalletSuccessSwaggerDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request payload or amount',
    type: ErrorResponseSwaggerDto,
  })
  @ApiNotFoundResponse({
    description: 'Wallet not found for user',
    type: ErrorResponseSwaggerDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token',
    type: ErrorResponseSwaggerDto,
  })
  async fundWallet(@GetUserId() userId: string, @Body() dto: FundWalletDto) {
    this.logger.log(
      `Fund wallet request received for userId: ${userId}, amount: ${dto.amount}`,
    );
    const data = await this.walletsService.fundWallet(
      userId,
      dto.amount,
      dto.description,
    );
    this.logger.log(`Wallet funded successfully for userId: ${userId}`);

    return {
      success: true,
      message: 'Wallet funded successfully',
      data,
    };
  }

  @Post('withdraw')
  @Auth(AuthType.Bearer)
  @ApiOperation({
    summary: 'Withdraw from wallet',
    description: 'Debits money from the authenticated user wallet balance.',
  })
  @ApiBody({ type: WithdrawWalletDto })
  @ApiOkResponse({
    description: 'Wallet withdrawn successfully',
    type: WithdrawWalletSuccessSwaggerDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request payload or insufficient balance',
    type: ErrorResponseSwaggerDto,
  })
  @ApiNotFoundResponse({
    description: 'Wallet not found for user',
    type: ErrorResponseSwaggerDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token',
    type: ErrorResponseSwaggerDto,
  })
  async withdrawWallet(
    @GetUserId() userId: string,
    @Body() dto: WithdrawWalletDto,
  ) {
    this.logger.log(
      `Withdraw wallet request received for userId: ${userId}, amount: ${dto.amount}`,
    );
    const data = await this.walletsService.withdrawWallet(
      userId,
      dto.amount,
      dto.description,
    );
    this.logger.log(`Wallet withdrawn successfully for userId: ${userId}`);

    return {
      success: true,
      message: 'Wallet withdrawn successfully',
      data,
    };
  }

  @Post('transfer')
  @Auth(AuthType.Bearer)
  @ApiOperation({
    summary: 'Transfer between wallets',
    description:
      'Transfers money from the authenticated user wallet to another user wallet.',
  })
  @ApiBody({ type: TransferWalletDto })
  @ApiOkResponse({
    description: 'Transfer completed successfully',
    type: TransferWalletSuccessSwaggerDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid payload, same recipient, or insufficient balance',
    type: ErrorResponseSwaggerDto,
  })
  @ApiNotFoundResponse({
    description: 'Sender or recipient wallet not found',
    type: ErrorResponseSwaggerDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token',
    type: ErrorResponseSwaggerDto,
  })
  async transferWallet(
    @GetUserId() userId: string,
    @Body() dto: TransferWalletDto,
  ) {
    this.logger.log(
      `Transfer request received from userId: ${userId} to recipientUserId: ${dto.recipientUserId}, amount: ${dto.amount}`,
    );
    const data = await this.walletsService.transferWallet(
      userId,
      dto.recipientUserId,
      dto.amount,
      dto.description,
    );
    this.logger.log(
      `Transfer completed successfully from userId: ${userId} to recipientUserId: ${dto.recipientUserId}`,
    );

    return {
      success: true,
      message: 'Transfer completed successfully',
      data,
    };
  }
}
