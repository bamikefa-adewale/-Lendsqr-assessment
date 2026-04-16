import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './provider/auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthType } from './enums/auth-types.enum';
import { Auth } from './decorators/auth.decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Auth(AuthType.None)
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
