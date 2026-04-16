# Lendsqr Backend Assessment - My Understanding

## Purpose of the Assessment

This test evaluates practical backend engineering skills for a non-entry-level role.  
The expected competence level is strong in:

- Node.js
- TypeScript
- MySQL (Build-in railway mysql)
- Knex
- API architecture and code quality

The main focus is not just "making endpoints work", but building a clean, testable, and production-minded MVP.

## Product Context

The app is a wallet service for a lending product ("Demo Credit").  
Borrowers need wallets to:

- receive loan disbursements
- send repayments

## Core MVP Features Required

1. A user can create an account.
2. A user can fund their wallet/account.
3. A user can transfer money to another user.
4. A user can withdraw money.
5. A user present in Lendsqr Adjutor Karma blacklist must not be onboarded.

## Technical Requirements (Must Use)

- Node.js (LTS)
- TypeScript
- Knex
- MySQL

## Additional Requirements

- Implement as a Node.js API.
- A full authentication system is not required.
- Faux token-based authentication is acceptable.
- Unit tests are required.
- Include positive and negative test scenarios.

## Blacklist Requirement (Critical)

During onboarding, the service must check Lendsqr Adjutor Karma blacklist.

- If user is blacklisted -> reject onboarding.
- If user is not blacklisted -> allow onboarding.

You are expected to sign up for Adjutor API to use this check.

## What Reviewers Will Assess

- Code quality (DRY/WET awareness)
- Attention to detail
- Architecture and design best practices
- Unit testing quality and coverage (positive + negative paths)
- Commit history and commit message quality
- README quality
- Folder/file organization
- Naming conventions and consistency
- Semantic API/resource path naming
- OOP usage
- Database design quality
- Proper transaction scoping

## Documentation Deliverables

You must provide a README design document that explains:

- implementation approach
- architectural decisions and rationale
- ER diagram (recommended with dbdesigner.net)

Implementation checklist documents in this codebase now include:

- `src/docs/wallet-fund-checklist.md`
- `src/docs/wallet-withdraw-checklist.md`
- `src/docs/wallet-transfer-checklist.md`

## Deployment Requirement

Deploy API to Heroku or another free cloud provider with URL format similar to:

`https://<candidate-name>-lendsqr-be-test.<cloud-platform-domain>`

## Submission Package

Provide a public document page (e.g., Notion/Google Docs) containing:

- review of your work
- reason for choices/technologies used
- deployed service URL
- GitHub repository URL
- Loom video review

## Loom Video Rule

- Must be Loom
- Must be 3 minutes or less
- Your face must be visible throughout (even during screen sharing)
- Explain what was requested and what was implemented, including any gaps

## Final Submission Steps

1. Submit the document and repository URLs using the assessment Google Form.
2. Send an email notification to [careers@lendsqr.com](mailto:careers@lendsqr.com) after submission.

## Risks That Commonly Cause Failure

- Not following the required tech stack
- Weak implementation quality for expected seniority level
- Missing required video format/details
- Missing acceptance criteria or delivery instructions

## Practical Build Checklist

- Initialize Node.js + TypeScript project
- Configure Knex + MySQL
- Design schema and ERD
- Build account creation with blacklist check
- Build fund wallet endpoint
- Build transfer endpoint with DB transaction handling
- Build withdraw endpoint with DB transaction handling
- Add faux token authentication
- Add unit tests (positive + negative)
- Write complete README design document
- Deploy service
- Create public review doc
- Record Loom video (<= 3 mins, face visible)
- Submit form + email careers

## Assumptions to Clarify Early

- Which user identifier to use for blacklist lookup (email, phone, BVN, etc.)
- Required fields for onboarding
- Currency and precision rules
- Whether wallet is auto-created on user signup
- Error behavior if Adjutor API is temporarily unavailable

These assumptions should be explicitly documented in the README to show decision quality.