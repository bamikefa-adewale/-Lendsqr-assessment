import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './provider/auth.service';
import { UserService } from '../user/user.service';
import { KarmaBlacklistService } from './provider/karma-blacklist.service';
import { HashingProvider } from './provider/hashing.provider';
import { GenerateTokenProvider } from './provider/generate-token.provider';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            createWithWallet: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: HashingProvider,
          useValue: {
            hashPassword: jest.fn().mockResolvedValue('hashed'),
            comparePassword: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: GenerateTokenProvider,
          useValue: {
            signAccessToken: jest.fn().mockResolvedValue('test-token'),
          },
        },
        {
          provide: KarmaBlacklistService,
          useValue: {
            assertEmailAllowed: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
