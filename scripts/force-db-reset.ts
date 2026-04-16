/**
 * Drops app tables and Knex migration metadata when migration files were removed
 * from disk (Knex rollback can no longer run). Then run: npm run db:migrate
 */
import * as dotenv from 'dotenv';
import knex from 'knex';
import { createKnexConfig } from '../src/config/knex-config';

const nodeEnv = process.env.NODE_ENV ?? 'development';
dotenv.config({ path: '.env' });
dotenv.config({ path: `.env.${nodeEnv}`, override: true });

async function main() {
  const db = knex(createKnexConfig());
  try {
    await db.raw('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of [
      'transactions',
      'wallets',
      'users',
      'knex_migrations_lock',
      'knex_migrations',
    ]) {
      await db.schema.dropTableIfExists(table);
    }
    await db.raw('SET FOREIGN_KEY_CHECKS = 1');
    // eslint-disable-next-line no-console
    console.log('Dropped transactions, wallets, users, and knex migration tables.');
  } finally {
    await db.destroy();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
