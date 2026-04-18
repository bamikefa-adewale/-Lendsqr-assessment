import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Knex } from 'knex';
import * as dotenv from 'dotenv';
import request from 'supertest';
import { App } from 'supertest/types';
import { appCreate } from '../app.create';
import { HttpExceptionFilter } from '../src/filters/http-exception.filter';
import { KNEX_CONNECTION } from '../src/database/database.constants';

process.env.NODE_ENV = 'development';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.development', override: true });

const AppModule = require('../src/app.module').AppModule;

jest.setTimeout(30000);

type RegisteredUser = {
  id: string;
  email: string;
  accessToken: string;
};

describe('Lending Wallet API (e2e)', () => {
  let app: INestApplication;
  let db: Knex;

  const createdUserIds = new Set<string>();
  const basePath = '/api/v1';
  const runId = `e2e-${Date.now()}`;
  let sequence = 0;

  const nextIdentity = () => {
    sequence += 1;
    return {
      email: `${runId}-${sequence}@example.com`,
      phoneNumber: `080000${String(sequence).padStart(6, '0')}`,
      password: 'hunter2hunter2',
      firstName: 'Ada',
      lastName: 'Lovelace',
    };
  };

  const registerUser = async (): Promise<RegisteredUser> => {
    const identity = nextIdentity();
    const response = await request(app.getHttpServer())
      .post(`${basePath}/auth/register`)
      .send(identity)
      .expect(201);

    createdUserIds.add(response.body.data.id);

    return {
      id: response.body.data.id,
      email: response.body.data.email,
      accessToken: response.body.data.accessToken,
    };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    appCreate(app);
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api/v1');
    await app.init();

    db = app.get<Knex>(KNEX_CONNECTION);
  });

  afterAll(async () => {
    const userIds = Array.from(createdUserIds);

    if (userIds.length > 0) {
      const walletRows = await db('wallets')
        .select('id')
        .whereIn('user_id', userIds);
      const walletIds = walletRows.map((row: { id: string }) => row.id);

      if (walletIds.length > 0) {
        await db('transactions')
          .whereIn('wallet_id', walletIds)
          .orWhereIn('related_wallet_id', walletIds)
          .del();

        await db('wallets').whereIn('id', walletIds).del();
      }

      await db('users').whereIn('id', userIds).del();
    }

    if (app) {
      await app.close();
    }
  });

  // this test will register a user, create a wallet, and return an access token

  describe('POST /auth/register', () => {
    it('registers a user, creates a wallet, and returns an access token', async () => {
      const identity = nextIdentity();

      const response = await request(app.getHttpServer())
        .post(`${basePath}/auth/register`)
        .send(identity)
        .expect(201);

      const userId = response.body.data.id;
      createdUserIds.add(userId);

      expect(response.body).toEqual(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          data: expect.objectContaining({
            accessToken: expect.any(String),
            id: userId,
            email: identity.email,
            phoneNumber: identity.phoneNumber,
            firstName: identity.firstName,
            lastName: identity.lastName,
          }),
        }),
      );

      const wallet = await db('wallets').where({ user_id: userId }).first();
      expect(wallet).toBeDefined();
      expect(Number(wallet.balance)).toBe(0);
      expect(wallet.status).toBe('active');
    });
  });
  // this test will login a user and return an access token
  describe('POST /auth/login', () => {
    it('logs in an existing user and returns an access token', async () => {
      const identity = nextIdentity();

      const registerResponse = await request(app.getHttpServer())
        .post(`${basePath}/auth/register`)
        .send(identity)
        .expect(201);

      createdUserIds.add(registerResponse.body.data.id);

      const response = await request(app.getHttpServer())
        .post(`${basePath}/auth/login`)
        .send({
          email: identity.email,
          password: identity.password,
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'User logged in successfully',
        data: {
          accessToken: expect.any(String),
        },
      });
    });
  });

  // this test will fund a user's wallet and write a ledger record
  describe('POST /wallets/fund', () => {
    it('funds the authenticated user wallet and writes a ledger record', async () => {
      const user = await registerUser();

      const response = await request(app.getHttpServer())
        .post(`${basePath}/wallets/fund`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          amount: 2500.5,
          description: 'Wallet top up via card',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Wallet funded successfully',
        data: {
          walletId: expect.any(String),
          previousBalance: 0,
          currentBalance: 2500.5,
          transactionReference: expect.any(String),
        },
      });

      const wallet = await db('wallets').where({ user_id: user.id }).first();
      expect(Number(wallet.balance)).toBe(2500.5);

      const transaction = await db('transactions')
        .where({ reference: response.body.data.transactionReference })
        .first();

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('fund');
      expect(Number(transaction.amount)).toBe(2500.5);
      expect(transaction.description).toBe('Wallet top up via card');
    });
  });

  // this test will withdraw funds from a user's wallet and write a ledger record
  describe('POST /wallets/withdraw', () => {
    it('withdraws from the authenticated user wallet and writes a ledger record', async () => {
      const user = await registerUser();

      await request(app.getHttpServer())
        .post(`${basePath}/wallets/fund`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          amount: 3000,
          description: 'Initial funding',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`${basePath}/wallets/withdraw`)
        .set('Authorization', `Bearer ${user.accessToken}`)
        .send({
          amount: 1200,
          description: 'ATM cashout',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Wallet withdrawn successfully',
        data: {
          walletId: expect.any(String),
          previousBalance: 3000,
          currentBalance: 1800,
          transactionReference: expect.any(String),
        },
      });

      const wallet = await db('wallets').where({ user_id: user.id }).first();
      expect(Number(wallet.balance)).toBe(1800);

      const transaction = await db('transactions')
        .where({ reference: response.body.data.transactionReference })
        .first();

      expect(transaction).toBeDefined();
      expect(transaction.type).toBe('withdraw');
      expect(Number(transaction.amount)).toBe(1200);
      expect(transaction.description).toBe('ATM cashout');
    });
  });

  // this test will transfer funds between users and write paired ledger records
  describe('POST /wallets/transfer', () => {
    it('transfers funds between users and writes paired ledger records', async () => {
      const sender = await registerUser();
      const recipient = await registerUser();

      await request(app.getHttpServer())
        .post(`${basePath}/wallets/fund`)
        .set('Authorization', `Bearer ${sender.accessToken}`)
        .send({
          amount: 5000,
          description: 'Seed balance',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post(`${basePath}/wallets/transfer`)
        .set('Authorization', `Bearer ${sender.accessToken}`)
        .send({
          recipientUserId: recipient.id,
          amount: 1750,
          description: 'Loan repayment transfer',
        })
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Transfer completed successfully',
        data: {
          transferGroupId: expect.any(String),
          sender: {
            walletId: expect.any(String),
            previousBalance: 5000,
            currentBalance: 3250,
            transactionReference: expect.any(String),
          },
          recipient: {
            walletId: expect.any(String),
            previousBalance: 0,
            currentBalance: 1750,
            transactionReference: expect.any(String),
          },
        },
      });

      const senderWallet = await db('wallets')
        .where({ user_id: sender.id })
        .first();
      const recipientWallet = await db('wallets')
        .where({ user_id: recipient.id })
        .first();

      expect(Number(senderWallet.balance)).toBe(3250);
      expect(Number(recipientWallet.balance)).toBe(1750);

      const transferTransactions = await db('transactions')
        .where({ group_id: response.body.data.transferGroupId })
        .orderBy('type', 'asc');

      expect(transferTransactions).toHaveLength(2);
      expect(transferTransactions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            wallet_id: response.body.data.sender.walletId,
            related_wallet_id: response.body.data.recipient.walletId,
            type: 'transfer_out',
            description: 'Loan repayment transfer',
          }),
          expect.objectContaining({
            wallet_id: response.body.data.recipient.walletId,
            related_wallet_id: response.body.data.sender.walletId,
            type: 'transfer_in',
            description: 'Loan repayment transfer',
          }),
        ]),
      );
    });
  });
});
