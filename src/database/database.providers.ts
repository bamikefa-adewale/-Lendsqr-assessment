import { ConfigService } from '@nestjs/config';
import { Knex, knex } from 'knex';
import { KNEX_CONNECTION } from './database.constants';
import { createKnexConfig } from '../config/knex-config';

export const databaseProviders = [
  {
    provide: KNEX_CONNECTION,
    inject: [ConfigService],
    useFactory: (_configService: ConfigService): Knex => {
      return knex(createKnexConfig(process.env));
    },
  },
];
