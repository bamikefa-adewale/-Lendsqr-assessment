import { Controller, Get, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { GetUserId } from '../auth/decorators/user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@GetUserId() userId: string) {
    this.logger.log(`Fetching profile for userId: ${userId}`);
    const data = await this.userService.getProfile(userId);
    this.logger.log(`Profile fetched successfully for userId: ${userId}`);
    return {
      success: true,
      message: 'User profile fetched successfully',
      data,
    };
  }
}
