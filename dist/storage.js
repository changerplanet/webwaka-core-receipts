"use strict";
/**
 * Storage interface for receipt data
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryReceiptStorage = void 0;
/**
 * In-memory implementation for testing
 */
class InMemoryReceiptStorage {
    constructor() {
        this.receipts = new Map();
        this.transactionIndex = new Map(); // transactionId -> receiptId
    }
    getKey(tenantId, receiptId) {
        return `${tenantId}:${receiptId}`;
    }
    getTransactionKey(tenantId, transactionId) {
        return `${tenantId}:${transactionId}`;
    }
    async createReceipt(receipt) {
        const key = this.getKey(receipt.tenantId, receipt.receiptId);
        const txKey = this.getTransactionKey(receipt.tenantId, receipt.transactionId);
        if (this.receipts.has(key)) {
            throw new Error(`Receipt already exists: ${receipt.receiptId}`);
        }
        if (this.transactionIndex.has(txKey)) {
            throw new Error(`Receipt already exists for transaction: ${receipt.transactionId}`);
        }
        this.receipts.set(key, receipt);
        this.transactionIndex.set(txKey, receipt.receiptId);
        return receipt;
    }
    async getReceipt(tenantId, receiptId) {
        const key = this.getKey(tenantId, receiptId);
        return this.receipts.get(key) || null;
    }
    async getReceiptByTransaction(tenantId, transactionId) {
        const txKey = this.getTransactionKey(tenantId, transactionId);
        const receiptId = this.transactionIndex.get(txKey);
        if (!receiptId) {
            return null;
        }
        return this.getReceipt(tenantId, receiptId);
    }
    async updateReceipt(tenantId, receiptId, updates) {
        const key = this.getKey(tenantId, receiptId);
        const existing = this.receipts.get(key);
        if (!existing) {
            throw new Error(`Receipt not found: ${receiptId}`);
        }
        const updated = {
            ...existing,
            ...updates,
            receiptId: existing.receiptId, // Immutable
            tenantId: existing.tenantId, // Immutable
            transactionId: existing.transactionId, // Immutable
            issuedAt: existing.issuedAt, // Immutable
            issuedBy: existing.issuedBy, // Immutable
        };
        this.receipts.set(key, updated);
        return updated;
    }
    async listReceipts(tenantId, limit = 100, offset = 0) {
        const tenantReceipts = Array.from(this.receipts.values())
            .filter(receipt => receipt.tenantId === tenantId)
            .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());
        return tenantReceipts.slice(offset, offset + limit);
    }
}
exports.InMemoryReceiptStorage = InMemoryReceiptStorage;
//# sourceMappingURL=storage.js.map