import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Knex } from 'knex';
import { randomUUID } from 'crypto';
import { KNEX_CONNECTION } from '../database/database.constants';
import { ServiceErrorHandlerProvider } from '../filters/service-error-handler.provider';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRow } from './interfaces/user-row.interface';
import { WalletsService } from '../wallets/providers/wallets.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(KNEX_CONNECTION) private readonly knex: Knex,
    private readonly walletsService: WalletsService,
    private readonly serviceErrorHandler: ServiceErrorHandlerProvider,
  ) {}

  // Create a user with a wallet
  async createWithWallet(
    dto: CreateUserDto,
    passwordHash: string,
    isBlacklisted = false,
  ): Promise<UserRow> {
    try {
      const userId = randomUUID();
      const email = dto.email.trim().toLowerCase();
      const phoneNumber = dto.phoneNumber.trim();

      await this.knex.transaction(async (trx) => {
        await trx('users').insert({
          id: userId,
          email,
          phone_number: phoneNumber,
          first_name: dto.firstName.trim(),
          last_name: dto.lastName.trim(),
          password_hash: passwordHash,
          is_blacklisted: isBlacklisted,
        });
        //this method will create a wallet for the user
        await this.walletsService.createWalletForUser(userId, trx);
      });

      const user = await this.knex<UserRow>('users')
        .where({ id: userId })
        .first();
      if (!user) {
        throw new NotFoundException('User was not found after create');
      }
      return user;
    } catch (err: unknown) {
      const code = (err as { code?: string; errno?: number })?.code;
      const errno = (err as { errno?: number })?.errno;
      if (code === 'ER_DUP_ENTRY' || errno === 1062) {
        throw new ConflictException(
          'Email or phone number is already registered',
        );
      }
      this.serviceErrorHandler.handleServiceError('create user', err);
    }
  }

  // Find a user by email
  async findByEmail(email: string): Promise<UserRow | undefined> {
    try {
      return this.knex<UserRow>('users')
        .where({ email: email.trim().toLowerCase() })
        .first();
    } catch (error) {
      this.serviceErrorHandler.handleServiceError('find user by email', error);
    }
  }

  // Get a user's profile
  async getProfile(userId: string) {
    try {
      const user = await this.knex<UserRow>('users')
        .where({ id: userId })
        .first();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return {
        id: user.id,
        email: user.email,
        phoneNumber: user.phone_number,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at,
      };
    } catch (error) {
      this.serviceErrorHandler.handleServiceError('fetch user profile', error);
    }
  }
}
