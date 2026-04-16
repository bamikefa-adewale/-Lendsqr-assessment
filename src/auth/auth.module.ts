import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './provider/auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { KarmaBlacklistService } from './provider/karma-blacklist.service';
import { HashingProvider } from './provider/hashing.provider';
import { BcryptProvider } from './provider/bcrypt.provider';
import { GenerateTokenProvider } from './provider/generate-token.provider';
import { jwtModuleAsProvider } from '../config/jwt.config';

@Module({
  imports: [UserModule, jwtModuleAsProvider()],
  controllers: [AuthController],
  providers: [
    AuthService,
    GenerateTokenProvider,
    BcryptProvider,
    {
      provide: HashingProvider,
      useExisting: BcryptProvider,
    },
    {
      provide: 'HashingProvider',
      useExisting: BcryptProvider,
    },
    KarmaBlacklistService,
  ],
  exports: [
    JwtModule,
    AuthService,
    GenerateTokenProvider,
    HashingProvider,
    'HashingProvider',
  ],
})
export class AuthModule {}
