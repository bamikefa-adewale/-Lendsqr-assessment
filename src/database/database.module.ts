import { Global, Inject, Logger, Module, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from './database.constants';
import { databaseProviders } from './database.providers';
import { DatabaseHealthService } from './database-health.service';

@Global()
@Module({
  providers: [...databaseProviders, DatabaseHealthService],
  exports: [...databaseProviders, DatabaseHealthService],
})
export class DatabaseModule implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      // Test database connection on startup
      await this.db.raw('SELECT 1');
      this.logger.log('✅ Database connection established successfully');
      
      // Log connection details
      const config = this.db.client.config;
      const connectionInfo = typeof config.connection === 'string' 
        ? 'via connection string' 
        : `to ${config.connection.host || 'localhost'}:${config.connection.port || 3306}`;
      
      this.logger.log(`📊 Connected to MySQL database ${connectionInfo}`);
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error.message);
      throw error;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    try {
      this.logger.log('🔌 Closing database connections...');
      await this.db.destroy();
      this.logger.log('✅ Database connections closed successfully');
    } catch (error) {
      this.logger.error('❌ Error closing database connections:', error.message);
      throw error;
    }
  }
}
