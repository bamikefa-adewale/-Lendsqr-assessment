import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { KNEX_CONNECTION } from '../database/database.constants';
import { ServiceErrorHandlerProvider } from '../filters/service-error-handler.provider';
import { WalletsService } from '../wallets/providers/wallets.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const mockKnex = jest.fn(() => ({
      insert: jest.fn().mockResolvedValue(undefined),
      where: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(undefined),
    }));
    (mockKnex as unknown as { transaction: jest.Mock }).transaction = jest
      .fn()
      .mockImplementation(async (cb: (trx: unknown) => Promise<void>) => {
        const trx = jest.fn(() => ({
          insert: jest.fn().mockResolvedValue(undefined),
        }));
        await cb(trx);
      });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: KNEX_CONNECTION, useValue: mockKnex },
        {
          provide: WalletsService,
          useValue: { createWalletForUser: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: ServiceErrorHandlerProvider,
          useValue: { handleServiceError: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
