import { Module } from '@nestjs/common';
import { ServiceErrorHandlerProvider } from '../filters/service-error-handler.provider';
import { WalletLedgerProvider } from './providers/wallet-ledger.provider';
import { WalletsService } from './providers/wallets.service';
import { WalletValidationProvider } from './providers/wallet-validation.provider';
import { WalletsController } from './wallets.controller';

@Module({
  controllers: [WalletsController],
  providers: [
    WalletsService,
    WalletValidationProvider,
    WalletLedgerProvider,
    ServiceErrorHandlerProvider,
  ],
  exports: [WalletsService],
})
export class WalletsModule {}
