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
  const isDevelopment = env.NODE_ENV === 'development';

  return {
    client: 'mysql2',
    connection: dbConfig.connection,
    pool: { 
      min: 0, 
      max: 10,
      // Log pool events for connection tracking
      afterCreate: (conn, done) => {
        console.log(`[DB] New connection established as id ${conn.threadId}`);
        done();
      },
    },
    // Enable debug logging in development
    debug: isDevelopment,
    // Custom logging configuration
    log: {
      warn(message) {
        console.warn(`[DB WARNING] ${message}`);
      },
      error(message) {
        console.error(`[DB ERROR] ${message}`);
      },
      deprecate(message) {
        console.warn(`[DB DEPRECATED] ${message}`);
      },
      debug(message) {
        if (isDevelopment) {
          console.log(`[DB DEBUG] ${message}`);
        }
      },
    },
    migrations: {
      directory: './src/database/migrations',
      extension: 'ts',
    },
  };
};
