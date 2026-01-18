# Module Contract: Core Receipts

## Purpose

The Core Receipts service provides a canonical proof system for all economic activity on the WebWaka platform. It enables any module to generate tamper-evident receipts for transactions and later prove that a transaction occurred with specific details. The service implements cryptographic verification and provides public verification data without leaking personally identifiable information (PII).

## Capabilities

This module provides the following capabilities:

- **Receipt Generation**: Create tamper-evident receipts for any economic transaction
- **Tamper Detection**: Cryptographic hash-based verification to detect modifications
- **Verification Primitives**: Methods to verify receipt integrity and authenticity
- **Public Verification**: Expose verification data without PII leakage
- **Audit Linkage**: Link receipts to audit events for comprehensive audit trails

## Dependencies

This module depends on:

- **webwaka-core-identity**: For user and tenant context (logical dependency)
- **webwaka-core-audit**: For audit event linkage (logical dependency)

The receipts service operates on `userId`, `tenantId`, and `auditEventId` values but does not directly call methods from these services.

## API Surface

### Public Interfaces

#### ReceiptService

The main service class that provides all receipt operations.

```typescript
class ReceiptService {
  constructor(config: ReceiptServiceConfig);
  
  // Receipt generation
  generateReceipt(input: CreateReceiptInput): Promise<Receipt>;
  
  // Receipt retrieval
  getReceipt(tenantId: TenantId, receiptId: ReceiptId): Promise<Receipt | null>;
  getReceiptByTransaction(tenantId: TenantId, transactionId: TransactionId): Promise<Receipt | null>;
  
  // Verification
  verifyReceipt(tenantId: TenantId, receiptId: ReceiptId): Promise<ReceiptVerificationResult>;
  verifyReceiptByCode(tenantId: TenantId, receiptId: ReceiptId, code: string): Promise<ReceiptVerificationResult>;
  getPublicReceiptData(tenantId: TenantId, receiptId: ReceiptId): Promise<PublicReceiptData | null>;
  
  // Status changes
  voidReceipt(input: VoidReceiptInput): Promise<Receipt>;
  refundReceipt(input: RefundReceiptInput): Promise<Receipt>;
  
  // Listing
  listReceipts(tenantId: TenantId, limit?: number, offset?: number): Promise<Receipt[]>;
}
```

#### Storage Interface

Storage abstraction for pluggable persistence backends.

```typescript
interface ReceiptStorage {
  createReceipt(receipt: Receipt): Promise<Receipt>;
  getReceipt(tenantId: TenantId, receiptId: ReceiptId): Promise<Receipt | null>;
  getReceiptByTransaction(tenantId: TenantId, transactionId: TransactionId): Promise<Receipt | null>;
  updateReceipt(tenantId: TenantId, receiptId: ReceiptId, updates: Partial<Receipt>): Promise<Receipt>;
  listReceipts(tenantId: TenantId, limit?: number, offset?: number): Promise<Receipt[]>;
}
```

### Events

This module does not emit events. It is a synchronous service that returns results directly.

## Data Models

### Receipt

```typescript
interface Receipt {
  receiptId: ReceiptId;
  tenantId: TenantId;
  transactionId: TransactionId;
  status: ReceiptStatus;          // ISSUED, VOIDED, REFUNDED
  issuedAt: Date;
  issuedBy: UserId;
  
  // Transaction details
  lineItems: ReceiptLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;               // ISO 4217 currency code
  
  // Payment information (no sensitive data)
  paymentMethod: string;          // e.g., "cash", "card", "transfer"
  
  // Audit linkage
  auditEventId?: AuditEventId;
  
  // Tamper detection
  hash: string;                   // SHA-256 hash of receipt content
  
  // Public verification data (no PII)
  verificationCode: string;       // Short code for manual verification (XXXX-XXXX)
  
  // Metadata
  metadata?: Record<string, unknown>;
}
```

### ReceiptLineItem

```typescript
interface ReceiptLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
}
```

### PublicReceiptData

```typescript
interface PublicReceiptData {
  receiptId: ReceiptId;
  verificationCode: string;
  issuedAt: Date;
  total: number;
  currency: string;
  status: ReceiptStatus;
  hash: string;
}
```

This data model is designed for public verification without exposing:
- Who issued the receipt (`issuedBy`)
- What was purchased (`lineItems` details)
- Transaction identifiers
- Tenant identifiers

## Security Considerations

### Tamper Detection

Each receipt is cryptographically hashed using SHA-256. The hash includes all immutable fields of the receipt. Any attempt to modify the receipt content will change the hash, which can be detected using the `verifyReceipt` method.

### Verification Code

A short verification code (format: `XXXX-XXXX`) is derived from the receipt hash. This code can be used for manual verification by customers or auditors without requiring access to the full receipt data.

### PII Protection

The `PublicReceiptData` interface provides a subset of receipt information suitable for public verification. It excludes:
- User identifiers
- Detailed line items
- Transaction identifiers
- Tenant identifiers

This allows customers to verify receipts without exposing sensitive business or personal information.

### Tenant Isolation

All receipt operations enforce strict tenant isolation. Receipts are partitioned by `tenantId`, and queries cannot cross tenant boundaries.

### Immutability

Receipt content is immutable after creation. The only mutable fields are:
- `status` (can change from ISSUED to VOIDED or REFUNDED)
- `metadata` (can be updated to record void/refund information)

Status changes are recorded in metadata with timestamp and actor information.

## Performance Expectations

### Storage Abstraction

The service uses a storage abstraction layer to allow for different persistence backends. The in-memory implementation is provided for testing and development. Production deployments should use a persistent storage backend (e.g., PostgreSQL, MongoDB).

### Expected Latency

- Receipt generation: < 100ms
- Receipt retrieval: < 50ms
- Receipt verification: < 50ms
- Receipt listing: < 500ms (depends on result size)

### Scalability

The service is stateless and horizontally scalable. Receipt storage should be designed for high write throughput and efficient querying by receipt ID and transaction ID.

## Verification Guarantees

### Hash-Based Verification

Receipts are verified using SHA-256 hashes. This provides the following guarantees:

1. **Content Integrity**: Any change to receipt content will change the hash.
2. **Authenticity**: The hash can be used to prove that a receipt was issued by the system.
3. **Non-Repudiation**: Once a receipt is issued, its existence and content cannot be denied.

### Verification Code

The verification code is a human-readable representation of the receipt hash. It provides:

1. **Manual Verification**: Customers can verify receipts using the short code.
2. **Fraud Detection**: Mismatched codes indicate tampering or fraud.
3. **Accessibility**: No technical knowledge required for basic verification.

## Audit Linkage

Receipts can be linked to audit events from the `webwaka-core-audit` service. This provides:

1. **Comprehensive Audit Trail**: Economic activity is linked to security events.
2. **Actor Attribution**: Receipt issuance is attributed to specific users.
3. **Compliance**: Regulatory requirements for audit trails are met.

When a receipt is generated, the caller can provide an `auditEventId` to link the receipt to a corresponding audit event (e.g., "sale.completed", "refund.issued").

## Versioning

This module follows semantic versioning (semver).

**Current version:** 0.1.0 (initial implementation)

### Breaking Changes

Breaking changes will increment the major version. Examples of breaking changes:
- Removing or renaming public interfaces
- Changing receipt data model structure
- Modifying hash computation algorithm
- Changing storage interface

### Non-Breaking Changes

Non-breaking changes will increment the minor or patch version. Examples:
- Adding new methods
- Adding optional parameters
- Adding new receipt statuses
- Performance improvements
- Bug fixes

## Scope Boundaries

This module is strictly limited to **shared core services**. It does not include:

- **UI Components**: No receipt printing, formatting, or display logic
- **Suite-Specific Logic**: No POS-specific formats or industry-specific fields
- **Delivery Extensions**: No WhatsApp integration, email delivery, or SMS
- **Reporting**: No analytics, dashboards, or business intelligence
- **Payment Processing**: No payment gateway integration or transaction processing

These capabilities belong to Suite modules or Extension modules, which can consume the Core Receipts service.
