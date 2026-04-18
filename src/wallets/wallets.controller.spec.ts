import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './providers/wallets.service';

function mockReq(idempotencyKey?: string): Request {
  return {
    headers: idempotencyKey
      ? { 'idempotency-key': idempotencyKey }
      : {},
  } as Request;
}

describe('WalletsController', () => {
  let controller: WalletsController;
  let walletsService: {
    fundWallet: jest.Mock;
    withdrawWallet: jest.Mock;
    transferWallet: jest.Mock;
  };

  beforeEach(async () => {
    walletsService = {
      fundWallet: jest.fn(),
      withdrawWallet: jest.fn(),
      transferWallet: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletsController],
      providers: [{ provide: WalletsService, useValue: walletsService }],
    }).compile();

    controller = module.get<WalletsController>(WalletsController);
  });

  it('funds wallet and returns success envelope', async () => {
    walletsService.fundWallet.mockResolvedValue({
      walletId: 'wallet-1',
      previousBalance: 1000,
      currentBalance: 1500,
      transactionReference: 'tx-ref',
    });

    const response = await controller.fundWallet(
      'user-1',
      {
        amount: 500,
        description: 'Top up',
      },
      mockReq('fund-key-1'),
    );

    expect(walletsService.fundWallet).toHaveBeenCalledWith(
      'user-1',
      500,
      'Top up',
      'fund-key-1',
    );
    expect(response).toEqual({
      success: true,
      message: 'Wallet funded successfully',
      data: {
        walletId: 'wallet-1',
        previousBalance: 1000,
        currentBalance: 1500,
        transactionReference: 'tx-ref',
      },
    });
  });

  it('withdraws wallet and returns success envelope', async () => {
    walletsService.withdrawWallet.mockResolvedValue({
      walletId: 'wallet-1',
      previousBalance: 1500,
      currentBalance: 1000,
      transactionReference: 'tx-ref',
    });

    const response = await controller.withdrawWallet(
      'user-1',
      {
        amount: 500,
        description: 'Bill payment',
      },
      mockReq('withdraw-key-1'),
    );

    expect(walletsService.withdrawWallet).toHaveBeenCalledWith(
      'user-1',
      500,
      'Bill payment',
      'withdraw-key-1',
    );
    expect(response).toEqual({
      success: true,
      message: 'Wallet withdrawn successfully',
      data: {
        walletId: 'wallet-1',
        previousBalance: 1500,
        currentBalance: 1000,
        transactionReference: 'tx-ref',
      },
    });
  });

  it('transfers between wallets and returns success envelope', async () => {
    walletsService.transferWallet.mockResolvedValue({
      transferGroupId: 'group-1',
      sender: {
        walletId: 'wallet-1',
        previousBalance: 2000,
        currentBalance: 1500,
        transactionReference: 'tx-out',
      },
      recipient: {
        walletId: 'wallet-2',
        previousBalance: 1000,
        currentBalance: 1500,
        transactionReference: 'tx-in',
      },
    });

    const response = await controller.transferWallet(
      'user-1',
      {
        recipientUserId: 'user-2',
        amount: 500,
        description: 'Repayment',
      },
      mockReq('transfer-key-1'),
    );

    expect(walletsService.transferWallet).toHaveBeenCalledWith(
      'user-1',
      'user-2',
      500,
      'Repayment',
      'transfer-key-1',
    );
    expect(response).toEqual({
      success: true,
      message: 'Transfer completed successfully',
      data: {
        transferGroupId: 'group-1',
        sender: {
          walletId: 'wallet-1',
          previousBalance: 2000,
          currentBalance: 1500,
          transactionReference: 'tx-out',
        },
        recipient: {
          walletId: 'wallet-2',
          previousBalance: 1000,
          currentBalance: 1500,
          transactionReference: 'tx-in',
        },
      },
    });
  });

  it('requires idempotency key header for mutations', async () => {
    await expect(
      controller.fundWallet(
        'user-1',
        {
          amount: 500,
          description: 'Top up',
        },
        mockReq(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
