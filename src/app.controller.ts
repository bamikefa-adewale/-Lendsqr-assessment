import { Controller, Get, Logger } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decoraator';
import { DatabaseHealthService } from './database/database-health.service';

@ApiTags('health')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly databaseHealthService: DatabaseHealthService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Root health',
    description: 'Simple liveness string for the API process.',
  })
  @ApiOkResponse({
    description: 'Plain text greeting',
    schema: { type: 'string', example: 'Hello World!' },
  })
  getHello(): string {
    this.logger.log('Health check endpoint called');
    return this.appService.getHello();
  }

  @Public()
  @Get('health/database')
  @ApiOperation({
    summary: 'Database connectivity',
    description: 'Runs `SELECT 1` and reports latency and connection status.',
  })
  @ApiOkResponse({
    description: 'Database health payload',
    schema: {
      type: 'object',
      required: ['status', 'database', 'timestamp'],
      properties: {
        status: {
          type: 'string',
          enum: ['healthy', 'unhealthy'],
          example: 'healthy',
        },
        database: {
          type: 'object',
          properties: {
            isConnected: { type: 'boolean', example: true },
            responseTime: { type: 'number', example: 12 },
            error: { type: 'string', nullable: true },
          },
        },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Database session info',
    description:
      'Returns MySQL session metadata (connection id, user, database, version, server time).',
  })
  @ApiOkResponse({
    description: 'Connection info or error envelope',
    schema: {
      oneOf: [
        {
          type: 'object',
          required: ['status', 'data', 'timestamp'],
          properties: {
            status: { type: 'string', example: 'success' },
            data: {
              type: 'object',
              additionalProperties: true,
              example: {
                connection_id: 12345,
                current_user: 'app_user@%',
                current_database: 'lending',
                mysql_version: '8.0.36',
                server_time: '2026-04-18T12:00:00.000Z',
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        {
          type: 'object',
          required: ['status', 'error', 'timestamp'],
          properties: {
            status: { type: 'string', example: 'error' },
            error: { type: 'string', example: 'Access denied' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      ],
    },
  })
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
