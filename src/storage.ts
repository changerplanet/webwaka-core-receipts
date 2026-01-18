/**
 * Storage interface for receipt data
 */

import { TenantId, ReceiptId, Receipt, TransactionId } from './types';

/**
 * Storage interface for receipts
 */
export interface ReceiptStorage {
  /**
   * Create a new receipt
   */
  createReceipt(receipt: Receipt): Promise<Receipt>;

  /**
   * Get a receipt by ID
   */
  getReceipt(tenantId: TenantId, receiptId: ReceiptId): Promise<Receipt | null>;

  /**
   * Get a receipt by transaction ID
   */
  getReceiptByTransaction(tenantId: TenantId, transactionId: TransactionId): Promise<Receipt | null>;

  /**
   * Update a receipt (for status changes only)
   */
  updateReceipt(tenantId: TenantId, receiptId: ReceiptId, updates: Partial<Receipt>): Promise<Receipt>;

  /**
   * List receipts for a tenant
   */
  listReceipts(tenantId: TenantId, limit?: number, offset?: number): Promise<Receipt[]>;
}

/**
 * In-memory implementation for testing
 */
export class InMemoryReceiptStorage implements ReceiptStorage {
  private receipts: Map<string, Receipt> = new Map();
  private transactionIndex: Map<string, string> = new Map(); // transactionId -> receiptId

  private getKey(tenantId: TenantId, receiptId: ReceiptId): string {
    return `${tenantId}:${receiptId}`;
  }

  private getTransactionKey(tenantId: TenantId, transactionId: TransactionId): string {
    return `${tenantId}:${transactionId}`;
  }

  async createReceipt(receipt: Receipt): Promise<Receipt> {
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

  async getReceipt(tenantId: TenantId, receiptId: ReceiptId): Promise<Receipt | null> {
    const key = this.getKey(tenantId, receiptId);
    return this.receipts.get(key) || null;
  }

  async getReceiptByTransaction(tenantId: TenantId, transactionId: TransactionId): Promise<Receipt | null> {
    const txKey = this.getTransactionKey(tenantId, transactionId);
    const receiptId = this.transactionIndex.get(txKey);

    if (!receiptId) {
      return null;
    }

    return this.getReceipt(tenantId, receiptId);
  }

  async updateReceipt(tenantId: TenantId, receiptId: ReceiptId, updates: Partial<Receipt>): Promise<Receipt> {
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

  async listReceipts(tenantId: TenantId, limit = 100, offset = 0): Promise<Receipt[]> {
    const tenantReceipts = Array.from(this.receipts.values())
      .filter(receipt => receipt.tenantId === tenantId)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime());

    return tenantReceipts.slice(offset, offset + limit);
  }
}
