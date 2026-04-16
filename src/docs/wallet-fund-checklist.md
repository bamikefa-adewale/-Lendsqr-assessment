# Wallet Fund Endpoint Checks

This document summarizes the critical checks for `POST /wallets/fund` and the current implementation status.

## Endpoint

- Route: `POST /wallets/fund`
- Auth: Bearer token required
- Purpose: Credit authenticated user's wallet and create ledger transaction

## 1) Ownership and Authorization

### Requirement

Do not allow users to fund another user's wallet.

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

- `fundWallet()` uses:
  - `await this.knex.transaction(async (trx) => { ... })`
- Inside transaction:
  - lock/read wallet
  - update wallet balance and timestamps
  - insert transaction ledger row

### Status

- Implemented.

## 3) Row Locking for Concurrency Safety

### Requirement

Prevent race conditions/lost updates when multiple fund requests happen concurrently.

### Current Implementation

- Wallet row is locked inside transaction:
  - `trx('wallets').where({ user_id }).forUpdate().first()`
- New balance is computed from the locked row before update.

### Status

- Implemented.

## 4) Input Validation (Very Important)

### Requirement

Never trust request body. Enforce:

- amount is a number
- amount > 0
- no negative funding

### Current Implementation

- DTO validation (`FundWalletDto`):
  - `@IsNumber({ maxDecimalPlaces: 2 })`
  - `@Min(0.01)`
- Service defensive check:
  - throws `BadRequestException` when `amount <= 0`
  - throws `BadRequestException` when precision is above 2 decimal places

### Status

- Implemented (validation in two layers).

## 5) Wallet Status Guard

### Requirement

Block wallet mutations when wallet status is not active.

### Current Implementation

- Service checks `wallet.status` before crediting.
- Throws `ForbiddenException('Wallet is not active')` for non-active wallets.

### Status

- Implemented.

## 6) Unique Transaction Reference

### Requirement

Each transaction should have a unique `reference`.

### Current Implementation

- `reference` generated using `randomUUID()`
- stored in `transactions.reference`
- DB unique constraint exists on `reference`

### Status

- Implemented.

## 7) Idempotency Clarification

### Current Position

Unique reference exists per created transaction, but strict retry-safe idempotency is not fully implemented.

### What strict idempotency would add

- accept client-provided idempotency key/reference
- on duplicate retries, return previous success instead of creating a new operation

### Status

- Optional enhancement (not yet implemented).

## 8) Testing Coverage

Current wallet tests include:

- successful funding
- validation failure (`amount <= 0`)
- validation failure (invalid decimal precision)
- wallet not found
- inactive wallet failure
- DB transaction failure propagation

### Status

- Implemented for unit level.

## 9) Manual API Test Note

When testing with `.http` file, always include:

- `Content-Type: application/json`

Without this header, `amount` may be parsed incorrectly and fail validation.

## Summary

The fund endpoint is currently aligned with key assessment expectations:

- authentication-bound wallet funding
- transaction-scoped writes
- concurrency-safe locking (`FOR UPDATE`)
- strict input validation
- unique transaction references

The main optional upgrade is full idempotency semantics for client retries.
