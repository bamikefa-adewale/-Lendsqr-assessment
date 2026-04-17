import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  //users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary();
    table.string('email', 191).notNullable().unique();
    table.string('phone_number', 20).notNullable().unique();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('password_hash', 255).notNullable();
    table.boolean('is_blacklisted').notNullable().defaultTo(false);
    table.timestamps(true, true);
  });

  //wallets table
  await knex.schema.createTable('wallets', (table) => {
    table.uuid('id').primary();

    table
      .uuid('user_id')
      .notNullable()
      .unique()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');

    table.decimal('balance', 16, 2).notNullable().defaultTo(0);
    table.string('currency', 10).notNullable().defaultTo('NGN');
    table
      .enum('status', ['active', 'frozen', 'closed'])
      .notNullable()
      .defaultTo('active');
    table.integer('version').notNullable().defaultTo(0);
    table.timestamp('last_transaction_at').nullable();
    table.timestamps(true, true);

    table.index(['user_id']);
  });
  //transactions table
  await knex.schema.createTable('transactions', (table) => {
    table.uuid('id').primary();
    table.uuid('wallet_id').notNullable().references('id').inTable('wallets');
    table
      .enum('type', ['fund', 'withdraw', 'transfer_in', 'transfer_out'])
      .notNullable();
    table.decimal('amount', 16, 2).notNullable();
    table
      .enum('status', ['pending', 'success', 'failed'])
      .notNullable()
      .defaultTo('pending');
    table.string('reference', 191).notNullable().unique();
    table.string('idempotency_key', 191).nullable();
    table
      .uuid('related_wallet_id')
      .nullable()
      .references('id')
      .inTable('wallets');
    table.uuid('group_id').nullable();
    table.string('description').nullable();
    table.timestamps(true, true);

    table.index(['wallet_id']);
    table.unique(['wallet_id', 'type', 'idempotency_key']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('wallets');
  await knex.schema.dropTableIfExists('users');
}
