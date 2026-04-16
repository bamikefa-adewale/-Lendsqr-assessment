import { Controller, Get, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decoraator';
import { DatabaseHealthService } from './database/database-health.service';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly databaseHealthService: DatabaseHealthService,
  ) {}

  @Public()
  @Get()
  getHello(): string {
    this.logger.log('Health check endpoint called');
    return this.appService.getHello();
  }

  @Public()
  @Get('health/database')
  async getDatabaseHealth() {
    this.logger.log('Database health check endpoint called');
    const health = await this.databaseHealthService.checkConnection();
    return {
      status: health.isConnected ? 'healthy' : 'unhealthy',
      database: health,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('health/database/info')
  async getDatabaseInfo() {
    this.logger.log('Database info endpoint called');
    try {
      const info = await this.databaseHealthService.getConnectionInfo();
      return {
        status: 'success',
        data: info,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
