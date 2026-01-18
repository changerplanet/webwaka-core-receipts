# webwaka-core-receipts

**Type:** core  
**Description:** Receipt generation, storage, and retrieval core service

## Status

✅ **Phase 2.4 Complete** - Core receipts service implemented and tested.

This module provides production-grade receipt generation and verification with cryptographic tamper detection and public verification without PII leakage.

## Features

- **Receipt Generation**: Create tamper-evident receipts for transactions
- **Tamper Detection**: Cryptographic hash-based verification
- **Verification Code**: Human-readable codes (XXXX-XXXX format)
- **Public Verification**: Verify receipts without exposing PII
- **Audit Linkage**: Link receipts to audit events
- **Status Management**: Support for voided and refunded receipts

## Installation

```bash
pnpm install
```

## Usage

```typescript
import { ReceiptService, InMemoryReceiptStorage } from 'webwaka-core-receipts';

// Create service instance
const receiptService = new ReceiptService({
  storage: new InMemoryReceiptStorage(),
});

// Generate a receipt
const receipt = await receiptService.generateReceipt({
  tenantId: 'tenant-1',
  transactionId: 'txn-123',
  issuedBy: 'user-1',
  lineItems: [
    {
      description: 'Product A',
      quantity: 2,
      unitPrice: 500,
      totalPrice: 1000,
    },
  ],
  subtotal: 1000,
  tax: 75,
  total: 1075,
  currency: 'NGN',
  paymentMethod: 'cash',
});

console.log(receipt.verificationCode); // e.g., "A3B4-C5D6"

// Verify receipt
const verification = await receiptService.verifyReceipt('tenant-1', receipt.receiptId);
console.log(verification.valid); // true

// Get public data (no PII)
const publicData = await receiptService.getPublicReceiptData('tenant-1', receipt.receiptId);
```

## Testing

```bash
pnpm test
```

## Documentation

- [Module Contract](./module.contract.md) - Defines the module's capabilities, dependencies, and API surface
- [Changelog](./CHANGELOG.md) - Version history and changes
- [Security Policy](./SECURITY.md) - Security guidelines and vulnerability reporting
- [Owners](./OWNERS.md) - Maintainers and code review requirements

## Module Manifest

See `module.manifest.json` for the complete module specification.

## Contributing

This module follows the WebWaka architectural rules:
- All changes must go through pull requests
- CI/CD checks must pass before merging
- Manifest validation is enforced automatically

## License

MIT
