"use strict";
/**
 * Hash utilities for receipt verification
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeReceiptHash = computeReceiptHash;
exports.verifyReceiptHash = verifyReceiptHash;
exports.generateVerificationCode = generateVerificationCode;
exports.verifyWithCode = verifyWithCode;
const crypto_1 = require("crypto");
const fast_json_stable_stringify_1 = __importDefault(require("fast-json-stable-stringify"));
/**
 * Compute a cryptographic hash of a receipt
 *
 * This creates a deterministic hash of the receipt's IMMUTABLE fields only.
 * Status and metadata are excluded because they change during lifecycle
 * (void/refund) but the original transaction proof must remain valid.
 *
 * Uses fast-json-stable-stringify for canonical JSON representation.
 */
function computeReceiptHash(receipt) {
    const hashInput = {
        receiptId: receipt.receiptId,
        tenantId: receipt.tenantId,
        transactionId: receipt.transactionId,
        issuedAt: receipt.issuedAt.toISOString(),
        issuedBy: receipt.issuedBy,
        lineItems: receipt.lineItems,
        subtotal: receipt.subtotal,
        tax: receipt.tax,
        total: receipt.total,
        currency: receipt.currency,
        paymentMethod: receipt.paymentMethod,
        auditEventId: receipt.auditEventId,
    };
    const canonical = (0, fast_json_stable_stringify_1.default)(hashInput);
    return (0, crypto_1.createHash)('sha256').update(canonical).digest('hex');
}
/**
 * Verify that a receipt's hash matches its content
 */
function verifyReceiptHash(receipt) {
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
function generateVerificationCode(hash) {
    // Take first 8 characters of hash and format as XXXX-XXXX
    const code = hash.substring(0, 8).toUpperCase();
    return `${code.substring(0, 4)}-${code.substring(4, 8)}`;
}
/**
 * Verify a receipt using its verification code
 */
function verifyWithCode(receipt, code) {
    const expectedCode = generateVerificationCode(receipt.hash);
    return expectedCode === code.toUpperCase();
}
//# sourceMappingURL=hash-utils.js.map