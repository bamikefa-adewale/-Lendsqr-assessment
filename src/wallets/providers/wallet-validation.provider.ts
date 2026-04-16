import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { WalletRow } from '../interfaces/wallet-row.interface';

@Injectable()
export class WalletValidationProvider {
  ensureWalletIsActive(wallet: WalletRow): void {
    if (wallet.status !== 'active') {
      throw new ForbiddenException('Wallet is not active');
    }
  }

  ensureAmountIsValid(amount: number): void {
    if (!Number.isFinite(amount)) {
      throw new BadRequestException('Amount must be a valid number');
    }
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    if (!Number.isInteger(amount * 100)) {
      throw new BadRequestException('Amount must have at most 2 decimal places');
    }
  }
}
