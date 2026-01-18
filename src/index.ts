/**
 * WebWaka Core Receipts Service
 * 
 * Provides receipt generation, verification, and proof of economic activity.
 */

// Main service
export { ReceiptService, ReceiptServiceConfig } from './receipt-service';

// Types
export {
  TenantId,
  UserId,
  ReceiptId,
  TransactionId,
  AuditEventId,
  ReceiptStatus,
  ReceiptLineItem,
  Receipt,
  CreateReceiptInput,
  ReceiptVerificationResult,
  PublicReceiptData,
  VoidReceiptInput,
  RefundReceiptInput,
} from './types';

// Storage interfaces
export {
  ReceiptStorage,
  InMemoryReceiptStorage,
} from './storage';

// Hash utilities
export {
  computeReceiptHash,
  verifyReceiptHash,
  generateVerificationCode,
  verifyWithCode,
} from './hash-utils';

// Validation
export {
  validate,
  TenantIdSchema,
  UserIdSchema,
  TransactionIdSchema,
  CurrencySchema,
  LineItemSchema,
  CreateReceiptInputSchema,
  VoidReceiptInputSchema,
  RefundReceiptInputSchema,
} from './validation';
