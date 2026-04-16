import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let service: {
    getAllUserTransactions: jest.Mock;
    getUserTransactionByReference: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      getAllUserTransactions: jest.fn(),
      getUserTransactionByReference: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: service }],
    }).compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('lists transactions for authenticated user', async () => {
    service.getAllUserTransactions.mockResolvedValue({
      data: [{ reference: 'ref-1' }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const response = await controller.listTransactions('user-1', {
      page: 1,
      limit: 20,
    });

    expect(service.getAllUserTransactions).toHaveBeenCalledWith('user-1', {
      page: 1,
      limit: 20,
    });
    expect(response.success).toBe(true);
    expect(response.data).toHaveLength(1);
  });

  it('gets transaction by reference for authenticated user', async () => {
    service.getUserTransactionByReference.mockResolvedValue({ reference: 'ref-1' });

    const response = await controller.getTransactionByReference('user-1', 'ref-1');

    expect(service.getUserTransactionByReference).toHaveBeenCalledWith(
      'user-1',
      'ref-1',
    );
    expect(response).toEqual({
      success: true,
      message: 'Transaction fetched successfully',
      data: { reference: 'ref-1' },
    });
  });
});
