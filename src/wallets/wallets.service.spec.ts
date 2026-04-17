import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ServiceErrorHandlerProvider } from '../filters/service-error-handler.provider';
import { WalletLedgerProvider } from './providers/wallet-ledger.provider';
import { WalletsService } from './providers/wallets.service';
import { WalletValidationProvider } from './providers/wallet-validation.provider';

describe('WalletsService', () => {
  let service: WalletsService;
  let knexMock: jest.Mock & { transaction: jest.Mock };
  let forUpdateMock: jest.Mock;
  let trxWhereMock: jest.Mock;
  let trxMock: jest.Mock & { fn: { now: jest.Mock } };
  let updateMock: jest.Mock;
  let insertMock: jest.Mock;
  let lockedWalletQueue: Array<unknown>;
  let transactionWhereMock: jest.Mock;
  let idempotentTransactionQueue: Array<unknown>;

  beforeEach(() => {
    updateMock = jest.fn().mockResolvedValue(1);
    insertMock = jest.fn().mockResolvedValue([1]);
    lockedWalletQueue = [];
    idempotentTransactionQueue = [];

    forUpdateMock = jest.fn(() => ({
      first: jest.fn().mockResolvedValue(lockedWalletQueue.shift()),
    }));
    trxWhereMock = jest.fn((criteria: { user_id?: string; id?: string }) => {
      if (criteria.user_id) {
        return { forUpdate: forUpdateMock };
      }
      if (criteria.id) {
        return { update: updateMock };
      }
      throw new Error('Unexpected where criteria');
    });
    transactionWhereMock = jest.fn(() => ({
      first: jest.fn().mockResolvedValue(idempotentTransactionQueue.shift()),
    }));

    trxMock = jest.fn((table: string) => {
      if (table === 'wallets') {
        return { where: trxWhereMock };
      }
      if (table === 'transactions') {
        return { insert: insertMock, where: transactionWhereMock };
      }
      throw new Error(`Unexpected table: ${table}`);
    }) as unknown as jest.Mock & { fn: { now: jest.Mock } };
    trxMock.fn = { now: jest.fn().mockReturnValue('NOW') };

    knexMock = jest.fn((table: string) => {
      if (table === 'wallets') {
        throw new Error('Unexpected direct wallets lookup');
      }
      throw new Error(`Unexpected table: ${table}`);
    }) as unknown as jest.Mock & { transaction: jest.Mock };
    knexMock.transaction = jest
      .fn()
      .mockImplementation((cb: (trx: unknown) => Promise<unknown>) =>
        cb(trxMock),
      );

    service = new WalletsService(
      knexMock as never,
      new WalletLedgerProvider(knexMock as never),
      new WalletValidationProvider(),
      new ServiceErrorHandlerProvider(),
    );
  });

  it('funds wallet and creates successful transaction', async () => {
    lockedWalletQueue.push({
      id: 'wallet-1',
      user_id: 'user-1',
      balance: 1000,
      status: 'active',
    });

    const result = await service.fundWallet('user-1', 500, 'Top up', 'fund-key-1');

    expect(result.walletId).toBe('wallet-1');
    expect(result.previousBalance).toBe(1000);
    expect(result.currentBalance).toBe(1500);
    expect(result.transactionReference).toBeTruthy();
    expect(forUpdateMock).toHaveBeenCalled();

    expect(trxWhereMock).toHaveBeenCalledWith({ id: 'wallet-1' });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        balance: 1500,
        last_transaction_at: 'NOW',
        updated_at: 'NOW',
      }),
    );
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wallet_id: 'wallet-1',
        type: 'fund',
        amount: 500,
        status: 'success',
        description: 'Top up',
      }),
    );
  });

  it('rejects funding with amount less than or equal to zero', async () => {
    await expect(service.fundWallet('user-1', 0, undefined, 'fund-key-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(knexMock).not.toHaveBeenCalled();
  });

  it('rejects funding when idempotency key is missing', async () => {
    await expect(
      service.fundWallet('user-1', 100, 'Top up'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects funding with more than 2 decimal places', async () => {
    await expect(service.fundWallet('user-1', 10.111, undefined, 'fund-key-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects funding for inactive wallet status', async () => {
    lockedWalletQueue.push({
      id: 'wallet-1',
      user_id: 'user-1',
      balance: 1000,
      status: 'frozen',
    });

    await expect(service.fundWallet('user-1', 100, undefined, 'fund-key-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws not found when wallet does not exist', async () => {
    lockedWalletQueue.push(undefined);

    await expect(
      service.fundWallet('missing-user', 500, undefined, 'fund-key-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates transaction error without swallowing it', async () => {
    lockedWalletQueue.push({
      id: 'wallet-1',
      user_id: 'user-1',
      balance: 1000,
      status: 'active',
    });
    knexMock.transaction.mockRejectedValueOnce(new Error('DB write failed'));

    await expect(service.fundWallet('user-1', 100, undefined, 'fund-key-1')).rejects.toThrow(
      'DB write failed',
    );
  });

  it('withdraws wallet and creates successful transaction', async () => {
    lockedWalletQueue.push({
      id: 'wallet-1',
      user_id: 'user-1',
      balance: 1500,
      status: 'active',
    });

    const result = await service.withdrawWallet(
      'user-1',
      500,
      'Bill payment',
      'withdraw-key-1',
    );

    expect(result.walletId).toBe('wallet-1');
    expect(result.previousBalance).toBe(1500);
    expect(result.currentBalance).toBe(1000);
    expect(result.transactionReference).toBeTruthy();
    expect(forUpdateMock).toHaveBeenCalled();

    expect(trxWhereMock).toHaveBeenCalledWith({ id: 'wallet-1' });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        balance: 1000,
        last_transaction_at: 'NOW',
        updated_at: 'NOW',
      }),
    );
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wallet_id: 'wallet-1',
        type: 'withdraw',
        amount: 500,
        status: 'success',
        description: 'Bill payment',
      }),
    );
  });

  it('rejects withdrawal with insufficient balance', async () => {
    lockedWalletQueue.push({
      id: 'wallet-1',
      user_id: 'user-1',
      balance: 200,
      status: 'active',
    });

    await expect(
      service.withdrawWallet('user-1', 500, undefined, 'withdraw-key-1'),
    ).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects withdrawal for inactive wallet status', async () => {
    lockedWalletQueue.push({
      id: 'wallet-1',
      user_id: 'user-1',
      balance: 2000,
      status: 'frozen',
    });

    await expect(
      service.withdrawWallet('user-1', 500, undefined, 'withdraw-key-1'),
    ).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('transfers between users and writes dual transaction records', async () => {
    lockedWalletQueue.push(
      {
        id: 'wallet-sender',
        user_id: 'user-1',
        balance: 3000,
        status: 'active',
      },
      {
        id: 'wallet-recipient',
        user_id: 'user-2',
        balance: 500,
        status: 'active',
      },
    );

    const result = await service.transferWallet(
      'user-1',
      'user-2',
      1000,
      'P2P',
      'transfer-key-1',
    );

    expect(result.transferGroupId).toBeTruthy();
    expect(result.sender.currentBalance).toBe(2000);
    expect(result.recipient.currentBalance).toBe(1500);
    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(insertMock).toHaveBeenCalledTimes(2);
    expect(insertMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        wallet_id: 'wallet-sender',
        related_wallet_id: 'wallet-recipient',
        type: 'transfer_out',
        amount: 1000,
        status: 'success',
      }),
    );
    expect(insertMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        wallet_id: 'wallet-recipient',
        related_wallet_id: 'wallet-sender',
        type: 'transfer_in',
        amount: 1000,
        status: 'success',
      }),
    );
  });

  it('rejects transfer to same user', async () => {
    await expect(
      service.transferWallet('user-1', 'user-1', 100, undefined, 'transfer-key-1'),
    ).rejects.toThrow('Cannot transfer to same user');
    expect(knexMock.transaction).not.toHaveBeenCalled();
  });

  it('returns existing transfer result for duplicate idempotency key', async () => {
    lockedWalletQueue.push(
      {
        id: 'wallet-sender',
        user_id: 'user-1',
        balance: 2000,
        status: 'active',
      },
      {
        id: 'wallet-recipient',
        user_id: 'user-2',
        balance: 1500,
        status: 'active',
      },
    );

    idempotentTransactionQueue.push(
      {
        id: 'tx-out',
        wallet_id: 'wallet-sender',
        type: 'transfer_out',
        amount: 1000,
        status: 'success',
        reference: 'existing-out-ref',
        idempotency_key: 'transfer-key-1',
        group_id: 'group-1',
      },
      {
        id: 'tx-in',
        wallet_id: 'wallet-recipient',
        type: 'transfer_in',
        amount: 1000,
        status: 'success',
        reference: 'existing-in-ref',
        idempotency_key: 'transfer-key-1',
        group_id: 'group-1',
      },
    );

    const result = await service.transferWallet(
      'user-1',
      'user-2',
      1000,
      'P2P',
      'transfer-key-1',
    );

    expect(result).toEqual({
      transferGroupId: 'group-1',
      sender: {
        walletId: 'wallet-sender',
        previousBalance: 3000,
        currentBalance: 2000,
        transactionReference: 'existing-out-ref',
      },
      recipient: {
        walletId: 'wallet-recipient',
        previousBalance: 500,
        currentBalance: 1500,
        transactionReference: 'existing-in-ref',
      },
    });
    expect(updateMock).not.toHaveBeenCalled();
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('throws not found when recipient wallet does not exist', async () => {
    lockedWalletQueue.push(
      {
        id: 'wallet-sender',
        user_id: 'user-1',
        balance: 1200,
        status: 'active',
      },
      undefined,
    );

    await expect(
      service.transferWallet('user-1', 'user-2', 200, undefined, 'transfer-key-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects transfer for insufficient sender balance', async () => {
    lockedWalletQueue.push(
      {
        id: 'wallet-sender',
        user_id: 'user-1',
        balance: 100,
        status: 'active',
      },
      {
        id: 'wallet-recipient',
        user_id: 'user-2',
        balance: 500,
        status: 'active',
      },
    );

    await expect(
      service.transferWallet('user-1', 'user-2', 300, undefined, 'transfer-key-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects transfer when recipient wallet is not active', async () => {
    lockedWalletQueue.push(
      {
        id: 'wallet-sender',
        user_id: 'user-1',
        balance: 1000,
        status: 'active',
      },
      {
        id: 'wallet-recipient',
        user_id: 'user-2',
        balance: 300,
        status: 'closed',
      },
    );

    await expect(
      service.transferWallet('user-1', 'user-2', 100, undefined, 'transfer-key-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('propagates transaction error for transfer without swallowing it', async () => {
    knexMock.transaction.mockRejectedValueOnce(
      new Error('Transfer write failed'),
    );

    await expect(
      service.transferWallet('user-1', 'user-2', 50, undefined, 'transfer-key-1'),
    ).rejects.toThrow('Transfer write failed');
  });
});
