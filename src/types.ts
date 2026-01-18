/**
 * Core type definitions for the Receipts service
 */

/**
 * Tenant identifier
 */
export type TenantId = string;

/**
 * User identifier
 */
export type UserId = string;

/**
 * Receipt identifier
 */
export type ReceiptId = string;

/**
 * Transaction identifier
 */
export type TransactionId = string;

/**
 * Audit event identifier (from core-audit)
 */
export type AuditEventId = string;

/**
 * Receipt status
 */
export enum ReceiptStatus {
  ISSUED = 'issued',
  VOIDED = 'voided',
  REFUNDED = 'refunded',
}

/**
 * Line item in a receipt
 */
export interface ReceiptLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, unknown>;
}

/**
 * Receipt data
 */
export interface Receipt {
  receiptId: ReceiptId;
  tenantId: TenantId;
  transactionId: TransactionId;
  status: ReceiptStatus;
  issuedAt: Date;
  issuedBy: UserId;
  
  // Transaction details
  lineItems: ReceiptLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  
  // Payment information (no sensitive data)
  paymentMethod: string;  // e.g., "cash", "card", "transfer"
  
  // Audit linkage
  auditEventId?: AuditEventId;
  
  // Tamper detection
  hash: string;
  
  // Public verification data (no PII)
  verificationCode: string;  // Short code for manual verification
  
  // Metadata
  metadata?: Record<string, unknown>;
}

/**
 * Create receipt input
 */
export interface CreateReceiptInput {
  tenantId: TenantId;
  transactionId: TransactionId;
  issuedBy: UserId;
  lineItems: ReceiptLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  auditEventId?: AuditEventId;
  metadata?: Record<string, unknown>;
}

/**
 * Receipt verification result
 */
export interface ReceiptVerificationResult {
  valid: boolean;
  receipt?: Receipt;
  reason?: string;
}

/**
 * Public receipt data (for verification, no PII)
 */
export interface PublicReceiptData {
  receiptId: ReceiptId;
  verificationCode: string;
  issuedAt: Date;
  total: number;
  currency: string;
  status: ReceiptStatus;
  hash: string;
}

/**
 * Void receipt input
 */
export interface VoidReceiptInput {
  tenantId: TenantId;
  receiptId: ReceiptId;
  voidedBy: UserId;
  reason: string;
  auditEventId?: AuditEventId;
}

/**
 * Refund receipt input
 */
export interface RefundReceiptInput {
  tenantId: TenantId;
  receiptId: ReceiptId;
  refundedBy: UserId;
  reason: string;
  auditEventId?: AuditEventId;
}
