import { Module } from '@nestjs/common';
import { ServiceErrorHandlerProvider } from '../filters/service-error-handler.provider';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [WalletsModule],
  controllers: [UserController],
  providers: [UserService, ServiceErrorHandlerProvider],
  exports: [UserService],
})
export class UserModule {}
