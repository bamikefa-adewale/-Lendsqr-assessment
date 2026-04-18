import { Controller, Get, Logger } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { GetUserId } from '../auth/decorators/user.decorator';
import { Auth } from '../auth/decorators/auth.decorators';
import { AuthType } from '../auth/enums/auth-types.enum';
import { GetMeSuccessSwaggerDto } from './dto/user-swagger.dto';
import { ErrorResponseSwaggerDto } from '../common/dto/error-response-swagger.dto';
import { authorizationBearerHeader } from '../common/swagger/http-headers.doc';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Get('me')
  @Auth(AuthType.Bearer)
  @ApiOperation({
    summary: 'Current user profile',
    description: 'Returns the authenticated user profile (no wallet balances).',
  })
  @ApiHeader(authorizationBearerHeader)
  @ApiOkResponse({
    description: 'User profile fetched successfully',
    type: GetMeSuccessSwaggerDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid bearer token',
    type: ErrorResponseSwaggerDto,
  })
  @ApiNotFoundResponse({
    description: 'User not found',
    type: ErrorResponseSwaggerDto,
  })
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
