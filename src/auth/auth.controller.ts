import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './provider/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthType } from './enums/auth-types.enum';
import { Auth } from './decorators/auth.decorators';
import {
  LoginSuccessSwaggerDto,
  RegisterSuccessSwaggerDto,
} from './dto/auth-swagger.dto';
import { ErrorResponseSwaggerDto } from '../common/dto/error-response-swagger.dto';
import { contentTypeJsonHeader } from '../common/swagger/http-headers.doc';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Auth(AuthType.None)
  @ApiOperation({
    summary: 'Register',
    description:
      'Creates a user, wallet, and returns profile fields with a JWT access token.',
  })
  @ApiHeader(contentTypeJsonHeader)
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({
    description: 'User registered successfully',
    type: RegisterSuccessSwaggerDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or malformed JSON',
    type: ErrorResponseSwaggerDto,
  })
  @ApiConflictResponse({
    description: 'Email or phone number already registered',
    type: ErrorResponseSwaggerDto,
  })
  @ApiForbiddenResponse({
    description: 'User is not eligible for onboarding (blacklisted)',
    type: ErrorResponseSwaggerDto,
  })
  async register(@Body() dto: RegisterDto) {
    this.logger.log(`Register request received for email: ${dto.email}`);
    const data = await this.authService.register(dto);
    this.logger.log(`User registered successfully for email: ${dto.email}`);
    return {
      success: true,
      message: 'User registered successfully',
      data,
    };
  }

  @Post('login')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description:
      'Authenticates by email and password and returns a JWT access token.',
  })
  @ApiHeader(contentTypeJsonHeader)
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'User logged in successfully',
    type: LoginSuccessSwaggerDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or malformed JSON',
    type: ErrorResponseSwaggerDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
    type: ErrorResponseSwaggerDto,
  })
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    this.logger.log(`User logged in successfully for email: ${dto.email}`);
    return {
      success: true,
      message: 'User logged in successfully',
      data,
    };
  }
}
