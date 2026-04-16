import { Injectable, Inject, Logger } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from './database.constants';

export interface DatabaseHealth {
  isConnected: boolean;
  responseTime: number;
  error?: string;
}

@Injectable()
export class DatabaseHealthService {
  private readonly logger = new Logger(DatabaseHealthService.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  async checkConnection(): Promise<DatabaseHealth> {
    const startTime = Date.now();
    
    try {
      await this.db.raw('SELECT 1 as health_check');
      const responseTime = Date.now() - startTime;
      
      this.logger.debug(`Database health check passed in ${responseTime}ms`);
      
      return {
        isConnected: true,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.logger.error(`Database health check failed: ${error.message}`);
      
      return {
        isConnected: false,
        responseTime,
        error: error.message,
      };
    }
  }

  async getConnectionInfo(): Promise<any> {
    try {
      const result = await this.db.raw(`
        SELECT 
          CONNECTION_ID() as connection_id,
          USER() as current_user,
          DATABASE() as current_database,
          VERSION() as mysql_version,
          NOW() as server_time
      `);
      
      return result[0][0];
    } catch (error) {
      this.logger.error(`Failed to get connection info: ${error.message}`);
      throw error;
    }
  }
}