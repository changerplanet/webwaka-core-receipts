/**
 * Hash utilities for receipt verification
 */

import { createHash } from 'crypto';
import { Receipt } from './types';

/**
 * Compute a cryptographic hash of a receipt
 * 
 * This creates a deterministic hash of the receipt's immutable fields,
 * which can be used to detect tampering.
 */
export function computeReceiptHash(receipt: Omit<Receipt, 'hash'>): string {
  const hashInput = {
    receiptId: receipt.receiptId,
    tenantId: receipt.tenantId,
    transactionId: receipt.transactionId,
    status: receipt.status,
    issuedAt: receipt.issuedAt.toISOString(),
    issuedBy: receipt.issuedBy,
    lineItems: receipt.lineItems,
    subtotal: receipt.subtotal,
    tax: receipt.tax,
    total: receipt.total,
    currency: receipt.currency,
    paymentMethod: receipt.paymentMethod,
    auditEventId: receipt.auditEventId,
    metadata: receipt.metadata,
  };

  const canonical = JSON.stringify(hashInput, Object.keys(hashInput).sort());
  return createHash('sha256').update(canonical).digest('hex');
}

/**
 * Verify that a receipt's hash matches its content
 */
export function verifyReceiptHash(receipt: Receipt): boolean {
  const { hash, ...receiptWithoutHash } = receipt;
  const computedHash = computeReceiptHash(receiptWithoutHash);
  return computedHash === hash;
}

/**
 * Generate a short verification code from a hash
 * 
 * This creates a human-readable code that can be used for manual verification.
 * Format: XXXX-XXXX (8 characters)
 */
export function generateVerificationCode(hash: string): string {
  // Take first 8 characters of hash and format as XXXX-XXXX
  const code = hash.substring(0, 8).toUpperCase();
  return `${code.substring(0, 4)}-${code.substring(4, 8)}`;
}

/**
 * Verify a receipt using its verification code
 */
export function verifyWithCode(receipt: Receipt, code: string): boolean {
  const expectedCode = generateVerificationCode(receipt.hash);
  return expectedCode === code.toUpperCase();
}
