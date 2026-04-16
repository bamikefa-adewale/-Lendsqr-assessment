import type { Knex } from 'knex';
import * as dotenv from 'dotenv';
import { createKnexConfig } from './src/config/knex-config';

const nodeEnv = process.env.NODE_ENV ?? 'development';
dotenv.config({ path: '.env' });
dotenv.config({ path: `.env.${nodeEnv}`, override: true });

const config: Knex.Config = createKnexConfig();

export default config;
