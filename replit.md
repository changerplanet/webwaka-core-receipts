# webwaka-core-receipts

## Overview
This is a TypeScript library that provides receipt generation, storage, and verification services with cryptographic tamper detection. It's a core service module, not a frontend or backend application.

## Project Type
Library/Core Service Module

## Key Features
- Receipt generation with cryptographic hashing
- Tamper-evident verification
- Human-readable verification codes (XXXX-XXXX format)
- Public verification without PII exposure
- Audit linkage support
- Receipt status management (void/refund)

## Tech Stack
- Node.js 20
- TypeScript 5
- Jest for testing
- Zod for schema validation
- ESLint for linting

## Project Structure
```
src/
  index.ts          - Main exports
  receipt-service.ts - Core receipt service implementation
  receipt-service.test.ts - Test suite
  types.ts          - TypeScript type definitions
  validation.ts     - Zod validation schemas
  storage.ts        - Receipt storage interface
  hash-utils.ts     - Cryptographic utilities
dist/               - Compiled JavaScript output
```

## Available Scripts
- `npm run build` - Compile TypeScript to JavaScript
- `npm run test` - Run Jest test suite
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type check without emitting

## Workflow
The "Run Tests" workflow executes the test suite to verify all functionality works correctly.

## No Server Component
This is a library module meant to be imported by other services. It does not run a web server or API endpoint.
