import type { Knex } from 'knex';

export interface DatabaseEnvConfig {
  connection: string | Knex.MySqlConnectionConfig;
}

export const getDatabaseEnvConfig = (
  env: NodeJS.ProcessEnv = process.env,
): DatabaseEnvConfig => {
  if (!env.MYSQL_URL) {
    throw new Error('MYSQL_URL is required for database connection');
  }

  return { connection: env.MYSQL_URL };
};

export const createKnexConfig = (
  env: NodeJS.ProcessEnv = process.env,
): Knex.Config => {
  const dbConfig = getDatabaseEnvConfig(env);

  return {
    client: 'mysql2',
    connection: dbConfig.connection,
    pool: { min: 0, max: 10 },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
    },
  };
};
