import {
  ForbiddenException,
  HttpException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { CreateUserDto } from '../../user/dto/create-user.dto';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { KarmaBlacklistService } from './karma-blacklist.service';
import { HashingProvider } from './hashing.provider';
import { GenerateTokenProvider } from './generate-token.provider';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly tokens: GenerateTokenProvider,
    private readonly karmaBlacklist: KarmaBlacklistService,
    private readonly hashing: HashingProvider,
  ) {}

  // Register a user
  async register(dto: RegisterDto) {
    try {
      const karmaStatus = await this.karmaBlacklist.getEmailBlacklistStatus(
        dto.email,
      );
      if (karmaStatus.isBlacklisted) {
        throw new ForbiddenException(
          'User is not eligible for onboarding (blacklisted)',
        );
      }
      this.logger.log(`Karma eligibility passed for email: ${dto.email}`);

      const profile: CreateUserDto = {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
      };
      const passwordHash = await this.hashing.hashPassword(dto.password);
      const user = await this.userService.createWithWallet(
        profile,
        passwordHash,
        karmaStatus.isBlacklisted,
      );
      const accessToken = await this.tokens.signAccessToken(
        user.id,
        user.email,
      );
      return {
        success: true,
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phone_number,
          firstName: user.first_name,
          lastName: user.last_name,
          createdAt: user.created_at,
        },
        accessToken,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        this.logger.error(`Register failed: ${error.message}`);
      } else {
        const errMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Register failed for email : unexpected error: ${errMsg}`,
        );
      }
      throw error;
    }
  }

  // Login a user
  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await this.hashing.comparePassword(
      dto.password,
      user.password_hash,
    );
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = await this.tokens.signAccessToken(user.id, user.email);
    return { accessToken };
  }
}
