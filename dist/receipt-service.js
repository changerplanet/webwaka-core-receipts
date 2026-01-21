"use strict";
/**
 * Core Receipt Service
 *
 * Provides receipt generation, verification, and proof of economic activity.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptService = void 0;
const crypto_1 = require("crypto");
const types_1 = require("./types");
const validation_1 = require("./validation");
const hash_utils_1 = require("./hash-utils");
/**
 * Receipt Service
 */
class ReceiptService {
    constructor(config) {
        this.storage = config.storage;
    }
    /**
     * Generate a receipt for a transaction
     */
    async generateReceipt(input) {
        const validated = (0, validation_1.validate)(validation_1.CreateReceiptInputSchema, input);
        // Generate receipt ID
        const receiptId = this.generateId();
        // Create receipt without hash
        const receiptWithoutHash = {
            receiptId,
            tenantId: validated.tenantId,
            transactionId: validated.transactionId,
            status: types_1.ReceiptStatus.ISSUED,
            issuedAt: new Date(),
            issuedBy: validated.issuedBy,
            lineItems: validated.lineItems,
            subtotal: validated.subtotal,
            tax: validated.tax,
            total: validated.total,
            currency: validated.currency,
            paymentMethod: validated.paymentMethod,
            auditEventId: validated.auditEventId,
            verificationCode: '', // Will be set after hash
            metadata: validated.metadata,
        };
        // Compute hash
        const hash = (0, hash_utils_1.computeReceiptHash)(receiptWithoutHash);
        // Generate verification code from hash
        const verificationCode = (0, hash_utils_1.generateVerificationCode)(hash);
        // Create final receipt
        const receipt = {
            ...receiptWithoutHash,
            hash,
            verificationCode,
        };
        // Store receipt
        return this.storage.createReceipt(receipt);
    }
    /**
     * Get a receipt by ID
     */
    async getReceipt(tenantId, receiptId) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        return this.storage.getReceipt(tenantId, receiptId);
    }
    /**
     * Get a receipt by transaction ID
     */
    async getReceiptByTransaction(tenantId, transactionId) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        return this.storage.getReceiptByTransaction(tenantId, transactionId);
    }
    /**
     * Verify a receipt's integrity
     */
    async verifyReceipt(tenantId, receiptId) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        const receipt = await this.storage.getReceipt(tenantId, receiptId);
        if (!receipt) {
            return {
                valid: false,
                reason: 'Receipt not found',
            };
        }
        const isValid = (0, hash_utils_1.verifyReceiptHash)(receipt);
        if (!isValid) {
            return {
                valid: false,
                receipt,
                reason: 'Receipt hash does not match content (tampered)',
            };
        }
        return {
            valid: true,
            receipt,
        };
    }
    /**
     * Verify a receipt using its verification code
     */
    async verifyReceiptByCode(tenantId, receiptId, code) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        const receipt = await this.storage.getReceipt(tenantId, receiptId);
        if (!receipt) {
            return {
                valid: false,
                reason: 'Receipt not found',
            };
        }
        const isValid = (0, hash_utils_1.verifyWithCode)(receipt, code);
        if (!isValid) {
            return {
                valid: false,
                receipt,
                reason: 'Verification code does not match',
            };
        }
        return {
            valid: true,
            receipt,
        };
    }
    /**
     * Get public receipt data (no PII)
     */
    async getPublicReceiptData(tenantId, receiptId) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        const receipt = await this.storage.getReceipt(tenantId, receiptId);
        if (!receipt) {
            return null;
        }
        return {
            receiptId: receipt.receiptId,
            verificationCode: receipt.verificationCode,
            issuedAt: receipt.issuedAt,
            total: receipt.total,
            currency: receipt.currency,
            status: receipt.status,
            hash: receipt.hash,
        };
    }
    /**
     * Void a receipt
     */
    async voidReceipt(input) {
        const validated = (0, validation_1.validate)(validation_1.VoidReceiptInputSchema, input);
        const receipt = await this.storage.getReceipt(validated.tenantId, validated.receiptId);
        if (!receipt) {
            throw new Error(`Receipt not found: ${validated.receiptId}`);
        }
        if (receipt.status !== types_1.ReceiptStatus.ISSUED) {
            throw new Error(`Cannot void receipt with status: ${receipt.status}`);
        }
        return this.storage.updateReceipt(validated.tenantId, validated.receiptId, {
            status: types_1.ReceiptStatus.VOIDED,
            metadata: {
                ...receipt.metadata,
                voidedBy: validated.voidedBy,
                voidedAt: new Date().toISOString(),
                voidReason: validated.reason,
                voidAuditEventId: validated.auditEventId,
            },
        });
    }
    /**
     * Mark a receipt as refunded
     */
    async refundReceipt(input) {
        const validated = (0, validation_1.validate)(validation_1.RefundReceiptInputSchema, input);
        const receipt = await this.storage.getReceipt(validated.tenantId, validated.receiptId);
        if (!receipt) {
            throw new Error(`Receipt not found: ${validated.receiptId}`);
        }
        if (receipt.status !== types_1.ReceiptStatus.ISSUED) {
            throw new Error(`Cannot refund receipt with status: ${receipt.status}`);
        }
        return this.storage.updateReceipt(validated.tenantId, validated.receiptId, {
            status: types_1.ReceiptStatus.REFUNDED,
            metadata: {
                ...receipt.metadata,
                refundedBy: validated.refundedBy,
                refundedAt: new Date().toISOString(),
                refundReason: validated.reason,
                refundAuditEventId: validated.auditEventId,
            },
        });
    }
    /**
     * List receipts for a tenant
     */
    async listReceipts(tenantId, limit = 100, offset = 0) {
        (0, validation_1.validate)(validation_1.TenantIdSchema, tenantId);
        return this.storage.listReceipts(tenantId, limit, offset);
    }
    /**
     * Generate a unique ID
     */
    generateId() {
        return (0, crypto_1.randomBytes)(16).toString('hex');
    }
}
exports.ReceiptService = ReceiptService;
//# sourceMappingURL=receipt-service.js.map