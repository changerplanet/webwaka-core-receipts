/**
 * Core Receipt Service
 *
 * Provides receipt generation, verification, and proof of economic activity.
 */
import { TenantId, ReceiptId, TransactionId, Receipt, CreateReceiptInput, VoidReceiptInput, RefundReceiptInput, ReceiptVerificationResult, PublicReceiptData } from './types';
import { ReceiptStorage } from './storage';
/**
 * Receipt service configuration
 */
export interface ReceiptServiceConfig {
    storage: ReceiptStorage;
}
/**
 * Receipt Service
 */
export declare class ReceiptService {
    private storage;
    constructor(config: ReceiptServiceConfig);
    /**
     * Generate a receipt for a transaction
     */
    generateReceipt(input: CreateReceiptInput): Promise<Receipt>;
    /**
     * Get a receipt by ID
     */
    getReceipt(tenantId: TenantId, receiptId: ReceiptId): Promise<Receipt | null>;
    /**
     * Get a receipt by transaction ID
     */
    getReceiptByTransaction(tenantId: TenantId, transactionId: TransactionId): Promise<Receipt | null>;
    /**
     * Verify a receipt's integrity
     */
    verifyReceipt(tenantId: TenantId, receiptId: ReceiptId): Promise<ReceiptVerificationResult>;
    /**
     * Verify a receipt using its verification code
     */
    verifyReceiptByCode(tenantId: TenantId, receiptId: ReceiptId, code: string): Promise<ReceiptVerificationResult>;
    /**
     * Get public receipt data (no PII)
     */
    getPublicReceiptData(tenantId: TenantId, receiptId: ReceiptId): Promise<PublicReceiptData | null>;
    /**
     * Void a receipt
     */
    voidReceipt(input: VoidReceiptInput): Promise<Receipt>;
    /**
     * Mark a receipt as refunded
     */
    refundReceipt(input: RefundReceiptInput): Promise<Receipt>;
    /**
     * List receipts for a tenant
     */
    listReceipts(tenantId: TenantId, limit?: number, offset?: number): Promise<Receipt[]>;
    /**
     * Generate a unique ID
     */
    private generateId;
}
//# sourceMappingURL=receipt-service.d.ts.map