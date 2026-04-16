import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { KNEX_CONNECTION } from '../database/database.constants';
import { ServiceErrorHandlerProvider } from '../filters/service-error-handler.provider';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let knexMock: jest.Mock;
  let builder: Record<string, jest.Mock>;

  beforeEach(async () => {
    builder = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      modify: jest.fn().mockReturnThis(),
      clone: jest.fn(),
      clearSelect: jest.fn().mockReturnThis(),
      clearOrder: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      first: jest.fn(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
    };
    builder.clone.mockImplementation(() => builder);

    knexMock = jest.fn(() => builder);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: KNEX_CONNECTION, useValue: knexMock },
        ServiceErrorHandlerProvider,
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('lists transactions with pagination metadata', async () => {
    builder.first.mockResolvedValueOnce({ count: '2' });
    builder.offset.mockResolvedValueOnce([
      { reference: 'ref-2' },
      { reference: 'ref-1' },
    ]);

    const result = await service.getAllUserTransactions('user-1', {
      page: 1,
      limit: 20,
    });

    expect(result.meta.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });

  it('gets transaction by reference for user', async () => {
    builder.first.mockResolvedValueOnce({ reference: 'ref-1' });

    const result = await service.getUserTransactionByReference('user-1', 'ref-1');
    expect(result.reference).toBe('ref-1');
  });

  it('throws not found when transaction does not exist', async () => {
    builder.first.mockResolvedValueOnce(undefined);

    await expect(
      service.getUserTransactionByReference('user-1', 'missing-ref'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
