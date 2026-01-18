# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Core receipts service implementation
- Receipt generation with cryptographic hash
- Tamper detection and verification primitives
- Verification code generation (XXXX-XXXX format)
- Public receipt data model (no PII leakage)
- Receipt status management (issued, voided, refunded)
- Audit event linkage
- Storage abstraction layer (ReceiptStorage)
- In-memory storage implementation for testing
- Comprehensive test suite with tenant isolation verification
- TypeScript type definitions and interfaces
- Input validation with Zod schemas
- ESLint and TypeScript configuration

## [0.1.0] - 2026-01-18

### Added
- Initial commit with governance structure
