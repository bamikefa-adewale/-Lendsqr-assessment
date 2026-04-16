import { registerAs } from '@nestjs/config';
import { getDatabaseEnvConfig } from './knex-config';

export default registerAs('database', () => getDatabaseEnvConfig());
