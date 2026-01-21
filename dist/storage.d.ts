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
export declare class InMemoryReceiptStorage implements ReceiptStorage {
    private receipts;
    private transactionIndex;
    private getKey;
    private getTransactionKey;
    createReceipt(receipt: Receipt): Promise<Receipt>;
    getReceipt(tenantId: TenantId, receiptId: ReceiptId): Promise<Receipt | null>;
    getReceiptByTransaction(tenantId: TenantId, transactionId: TransactionId): Promise<Receipt | null>;
    updateReceipt(tenantId: TenantId, receiptId: ReceiptId, updates: Partial<Receipt>): Promise<Receipt>;
    listReceipts(tenantId: TenantId, limit?: number, offset?: number): Promise<Receipt[]>;
}
//# sourceMappingURL=storage.d.ts.map