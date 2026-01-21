/**
 * WebWaka Core Receipts Service
 *
 * Provides receipt generation, verification, and proof of economic activity.
 */
export { ReceiptService, ReceiptServiceConfig } from './receipt-service';
export { TenantId, UserId, ReceiptId, TransactionId, AuditEventId, ReceiptStatus, ReceiptLineItem, Receipt, CreateReceiptInput, ReceiptVerificationResult, PublicReceiptData, VoidReceiptInput, RefundReceiptInput, } from './types';
export { ReceiptStorage, InMemoryReceiptStorage, } from './storage';
export { computeReceiptHash, verifyReceiptHash, generateVerificationCode, verifyWithCode, } from './hash-utils';
export { validate, TenantIdSchema, UserIdSchema, TransactionIdSchema, CurrencySchema, LineItemSchema, CreateReceiptInputSchema, VoidReceiptInputSchema, RefundReceiptInputSchema, } from './validation';
//# sourceMappingURL=index.d.ts.map