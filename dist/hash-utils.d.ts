/**
 * Hash utilities for receipt verification
 */
import { Receipt } from './types';
/**
 * Compute a cryptographic hash of a receipt
 *
 * This creates a deterministic hash of the receipt's IMMUTABLE fields only.
 * Status and metadata are excluded because they change during lifecycle
 * (void/refund) but the original transaction proof must remain valid.
 *
 * Uses fast-json-stable-stringify for canonical JSON representation.
 */
export declare function computeReceiptHash(receipt: Omit<Receipt, 'hash'>): string;
/**
 * Verify that a receipt's hash matches its content
 */
export declare function verifyReceiptHash(receipt: Receipt): boolean;
/**
 * Generate a short verification code from a hash
 *
 * This creates a human-readable code that can be used for manual verification.
 * Format: XXXX-XXXX (8 characters)
 */
export declare function generateVerificationCode(hash: string): string;
/**
 * Verify a receipt using its verification code
 */
export declare function verifyWithCode(receipt: Receipt, code: string): boolean;
//# sourceMappingURL=hash-utils.d.ts.map