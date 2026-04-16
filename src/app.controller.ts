import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decoraator';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    this.logger.log('Health check endpoint called');
    return this.appService.getHello();
  }
}
