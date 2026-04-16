import { Module } from '@nestjs/common';
import { ServiceErrorHandlerProvider } from '../filters/service-error-handler.provider';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';

@Module({
  controllers: [TransactionsController],
  providers: [TransactionsService, ServiceErrorHandlerProvider],
})
export class TransactionsModule {}
