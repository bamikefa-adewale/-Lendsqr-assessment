import { Controller, Get, Query, Param, Logger } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorators';
import { GetUserId } from '../auth/decorators/user.decorator';
import { AuthType } from '../auth/enums/auth-types.enum';
import { ListTransactionsQueryDto } from './dto/list-transactions-query.dto';
import {
  GetTransactionSuccessSwaggerDto,
  ListTransactionsSuccessSwaggerDto,
} from './dto/transactions-swagger.dto';
import { ErrorResponseSwaggerDto } from '../common/dto/error-response-swagger.dto';
import { TransactionType } from './enums/transaction-type.enum';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth('bearer')
@Controller('transactions')
export class TransactionsController {
  private readonly logger = new Logger(TransactionsController.name);

  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @Auth(AuthType.Bearer)
  @ApiOperation({
    summary: 'List user transactions',
    description:
      'Returns paginated transactions for the authenticated user. Supports optional filters by transaction type and status.',
  })
  @ApiBearerAuth('bearer')
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'Bearer access token',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (min: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Items per page (min: 1, max: 100)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: TransactionType,
    description: 'Filter by transaction type',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['pending', 'success', 'failed'],
    description: 'Filter by transaction status',
  })
  @ApiOkResponse({
    description: 'Transactions fetched successfully',
    type: ListTransactionsSuccessSwaggerDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
    type: ErrorResponseSwaggerDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token',
    type: ErrorResponseSwaggerDto,
  })
  async listTransactions(
    @GetUserId() userId: string,
    @Query() query: ListTransactionsQueryDto,
  ) {
    this.logger.log(
      `List transactions request received for userId: ${userId} with query: ${JSON.stringify(query)}`,
    );
    const data = await this.transactionsService.getAllUserTransactions(
      userId,
      query,
    );
    this.logger.log(`Transactions fetched successfully for userId: ${userId}`);
    return {
      success: true,
      message: 'Transactions fetched successfully',
      ...data,
    };
  }

  @Get(':reference')
  @Auth(AuthType.Bearer)
  @ApiOperation({
    summary: 'Get transaction by reference',
    description:
      'Returns a single transaction belonging to the authenticated user by its unique reference.',
  })
  @ApiBearerAuth('bearer')
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'Bearer access token',
    example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @ApiParam({
    name: 'reference',
    type: String,
    description: 'Unique transaction reference',
    example: 'TXN-1234567890',
  })
  @ApiOkResponse({
    description: 'Transaction fetched successfully',
    type: GetTransactionSuccessSwaggerDto,
  })
  @ApiNotFoundResponse({
    description: 'Transaction not found for the authenticated user',
    type: ErrorResponseSwaggerDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token',
    type: ErrorResponseSwaggerDto,
  })
  async getTransactionByReference(
    @GetUserId() userId: string,
    @Param('reference') reference: string,
  ) {
    this.logger.log(
      `Get transaction request received for userId: ${userId}, reference: ${reference}`,
    );
    const data = await this.transactionsService.getUserTransactionByReference(
      userId,
      reference,
    );
    this.logger.log(
      `Transaction fetched successfully for userId: ${userId}, reference: ${reference}`,
    );
    return {
      success: true,
      message: 'Transaction fetched successfully',
      data,
    };
  }
}
