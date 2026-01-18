# webwaka-core-receipts

## Overview
Phase 2 — Step 05 of the WebWaka Modular Rebuild. This is a TypeScript library that provides receipt generation, storage, and verification services with cryptographic tamper detection. It's a core service module, not a frontend or backend application.

## Project Type
Library/Core Service Module (Headless)

## Key Features
- Receipt generation with SHA-256 cryptographic hashing
- Deterministic canonical JSON via fast-json-stable-stringify
- Tamper-evident verification
- Human-readable verification codes (XXXX-XXXX format)
- Public verification without PII exposure
- Audit linkage support
- Receipt status management (void/refund)
- Tenant isolation

## Tech Stack
- Node.js 20
- TypeScript 5
- Jest for testing (33 tests, >80% coverage)
- Zod for schema validation
- fast-json-stable-stringify for deterministic hashing
- ESLint for linting

## Dependencies
Declares dependency on:
- webwaka-core-identity
- webwaka-core-audit

## Project Structure
```
src/
  index.ts              - Main exports
  receipt-service.ts    - Core receipt service implementation
  receipt-service.test.ts - Test suite (33 tests)
  types.ts              - TypeScript type definitions
  validation.ts         - Zod validation schemas
  storage.ts            - Receipt storage interface + InMemoryReceiptStorage
  hash-utils.ts         - SHA-256 cryptographic utilities
dist/                   - Compiled JavaScript output
```

## Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run test` - Run Jest test suite
- `npm run test -- --coverage` - Run with coverage report
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emitting

## Workflow
The "Run Tests" workflow executes the test suite to verify all functionality works correctly.

## Hard Stop Condition
Proven in tests: "A Suite can generate a receipt for a transaction and later prove—cryptographically and deterministically—that the transaction occurred, has not been tampered with, belongs to the correct tenant, and can be publicly verified without exposing PII."

## No Server Component
This is a library module meant to be imported by other services. It does not run a web server or API endpoint.
