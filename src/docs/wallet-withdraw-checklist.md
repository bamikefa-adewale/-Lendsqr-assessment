# Wallet Withdraw Endpoint Checks

This document summarizes the critical checks for `POST /wallets/withdraw` and the current implementation status.

## Endpoint

- Route: `POST /wallets/withdraw`
- Auth: Bearer token required
- Purpose: Debit authenticated user's wallet and create ledger transaction

## 1) Ownership and Authorization

### Requirement

Do not allow users to withdraw from another user's wallet.

### Current Implementation

- Controller uses `@GetUserId()` from token claims.
- Service fetches wallet by `user_id` tied to authenticated user.
- No external `walletId` is accepted from request body, reducing abuse surface.

### Status

- Implemented.

## 2) Database Transaction Scoping (Critical)

### Requirement

Wrap balance update and transaction insert in a single DB transaction.

### Current Implementation

- `withdrawWallet()` uses shared transactional helper:
  - `await this.knex.transaction(async (trx) => { ... })`
- Inside transaction:
  - lock/read wallet
  - validate withdrawal rules
  - update wallet balance and timestamps
  - insert transaction ledger row

### Status

- Implemented.

## 3) Row Locking for Concurrency Safety

### Requirement

Prevent race conditions/overspending when multiple withdraw requests happen concurrently.

### Current Implementation

- Wallet row is locked inside transaction:
  - `trx('wallets').where({ user_id }).forUpdate().first()`
- Withdrawal checks and debit are done against the locked row.

### Status

- Implemented.

## 4) Input Validation (Very Important)

### Requirement

Never trust request body. Enforce:

- amount is a number
- amount > 0
- no zero/negative withdrawals

### Current Implementation

- DTO validation (`WithdrawWalletDto`):
  - `@IsNumber({ maxDecimalPlaces: 2 })`
  - `@Min(0.01)`
- Service defensive check:
  - throws `BadRequestException` when `amount <= 0`

### Status

- Implemented (validation in two layers).

## 5) Sufficient Balance Rule (Critical)

### Requirement

Do not allow debit when wallet balance is less than requested amount.

### Current Implementation

- Service compares locked wallet balance with request amount.
- Throws `BadRequestException('Insufficient wallet balance')` if funds are not enough.

### Status

- Implemented.

## 6) Wallet Status Guard

### Requirement

Block withdrawals from wallets that are not active.

### Current Implementation

- Service checks `wallet.status`.
- Throws `ForbiddenException('Wallet is not active')` when status is not `active`.

### Status

- Implemented.

## 7) Unique Transaction Reference

### Requirement

Each transaction should have a unique `reference`.

### Current Implementation

- `reference` generated using `randomUUID()`
- stored in `transactions.reference`
- DB unique constraint exists on `reference`

### Status

- Implemented.

## 8) Testing Coverage

Current wallet tests include:

- successful withdrawal
- insufficient balance failure
- inactive wallet failure

### Status

- Implemented for unit level.

## 9) Manual API Test Note

When testing with `.http` file, always include:

- `Content-Type: application/json`
- `Authorization: Bearer {{token}}`

Without these headers, request parsing or authorization will fail.

## Summary

The withdraw endpoint is currently aligned with key assessment expectations:

- authentication-bound wallet debit
- transaction-scoped writes
- concurrency-safe locking (`FOR UPDATE`)
- strict input validation
- wallet status and sufficient balance enforcement
- unique transaction references

The main optional upgrade is full idempotency semantics for client retries.
