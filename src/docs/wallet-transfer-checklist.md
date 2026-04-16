# Wallet Transfer Endpoint Checks

This document summarizes the critical checks for `POST /wallets/transfer` and the current implementation status.

## Endpoint

- Route: `POST /wallets/transfer`
- Auth: Bearer token required
- Purpose: Move funds from authenticated user's wallet to another user's wallet and create paired ledger transactions

## 1) Ownership and Authorization

### Requirement

Do not allow users to debit another user's wallet as sender.

### Current Implementation

- Controller uses `@GetUserId()` from token claims for sender identity.
- Service resolves sender wallet by sender `user_id`.
- Request body only receives recipient user id and amount.

### Status

- Implemented.

## 2) Self-Transfer Prevention

### Requirement

Reject transfers where sender and recipient are the same user.

### Current Implementation

- Service compares `userId` and `recipientUserId`.
- Throws `BadRequestException('Cannot transfer to same user')`.

### Status

- Implemented.

## 3) Database Transaction Scoping (Critical)

### Requirement

Debit sender, credit recipient, and ledger entries must succeed/fail together.

### Current Implementation

- `transferWallet()` uses one `knex.transaction(...)`.
- Inside transaction:
  - lock sender wallet
  - lock recipient wallet
  - apply debit/credit updates
  - insert `transfer_out` and `transfer_in` records

### Status

- Implemented.

## 4) Row Locking for Concurrency Safety

### Requirement

Prevent race conditions and double-spend on concurrent transfers.

### Current Implementation

- Both sender and recipient wallets are fetched with `FOR UPDATE`.
- Balance checks and writes occur within same transaction on locked rows.

### Status

- Implemented.

## 5) Input Validation (Very Important)

### Requirement

Never trust request body. Enforce:

- recipient id is valid UUID
- amount is number
- amount > 0
- amount precision max 2 decimal places

### Current Implementation

- DTO validation (`TransferWalletDto`):
  - `@IsUUID()`
  - `@IsNumber({ maxDecimalPlaces: 2 })`
  - `@Min(0.01)`
- Service defensive checks:
  - finite amount check
  - positive amount check
  - 2-decimal-place precision check

### Status

- Implemented (validation in two layers).

## 6) Wallet State and Funds Checks

### Requirement

- sender wallet must be active
- recipient wallet must be active
- sender must have sufficient balance
- recipient wallet must exist

### Current Implementation

- Service rejects non-active wallets with `ForbiddenException('Wallet is not active')`.
- Service rejects low balance with `BadRequestException('Insufficient wallet balance')`.
- Service rejects missing recipient wallet with `NotFoundException('Recipient wallet not found')`.

### Status

- Implemented.

## 7) Ledger Integrity

### Requirement

Every transfer should have paired transaction entries linked for auditability.

### Current Implementation

- Creates one `transfer_out` record for sender and one `transfer_in` record for recipient.
- Uses shared `group_id` to link both records.
- Sets `related_wallet_id` on each record.
- Each row has unique `reference`.

### Status

- Implemented.

## 8) Testing Coverage

Current wallet tests include:

- successful transfer
- recipient wallet not found
- insufficient sender balance
- same-user transfer rejection
- inactive recipient wallet rejection
- transaction failure propagation

### Status

- Implemented for unit level.

## 9) Manual API Test Note

When testing with `.http` file, include:

- `Content-Type: application/json`
- `Authorization: Bearer {{token}}`

Use a valid `recipientUserId` of another registered user.

## Summary

The transfer endpoint aligns with key assessment expectations:

- authenticated sender identity
- transaction-scoped money movement
- row-level locking for concurrency safety
- strict validation and state checks
- paired ledger audit records
