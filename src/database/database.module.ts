import { Global, Inject, Module, OnApplicationShutdown } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from './database.constants';
import { databaseProviders } from './database.providers';

@Global()
@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(KNEX_CONNECTION) private readonly db: Knex) {}

  async onApplicationShutdown(): Promise<void> {
    await this.db.destroy();
  }
}
