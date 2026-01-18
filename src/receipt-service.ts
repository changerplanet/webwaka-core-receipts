/**
 * Core Receipt Service
 * 
 * Provides receipt generation, verification, and proof of economic activity.
 */

import { randomBytes } from 'crypto';
import {
  TenantId,
  ReceiptId,
  TransactionId,
  Receipt,
  ReceiptStatus,
  CreateReceiptInput,
  VoidReceiptInput,
  RefundReceiptInput,
  ReceiptVerificationResult,
  PublicReceiptData,
} from './types';
import {
  validate,
  CreateReceiptInputSchema,
  VoidReceiptInputSchema,
  RefundReceiptInputSchema,
  TenantIdSchema,
} from './validation';
import { ReceiptStorage } from './storage';
import { computeReceiptHash, verifyReceiptHash, generateVerificationCode, verifyWithCode } from './hash-utils';

/**
 * Receipt service configuration
 */
export interface ReceiptServiceConfig {
  storage: ReceiptStorage;
}

/**
 * Receipt Service
 */
export class ReceiptService {
  private storage: ReceiptStorage;

  constructor(config: ReceiptServiceConfig) {
    this.storage = config.storage;
  }

  /**
   * Generate a receipt for a transaction
   */
  async generateReceipt(input: CreateReceiptInput): Promise<Receipt> {
    const validated = validate(CreateReceiptInputSchema, input);

    // Generate receipt ID
    const receiptId = this.generateId();

    // Create receipt without hash
    const receiptWithoutHash: Omit<Receipt, 'hash'> = {
      receiptId,
      tenantId: validated.tenantId,
      transactionId: validated.transactionId,
      status: ReceiptStatus.ISSUED,
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
    const hash = computeReceiptHash(receiptWithoutHash);

    // Generate verification code from hash
    const verificationCode = generateVerificationCode(hash);

    // Create final receipt
    const receipt: Receipt = {
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
  async getReceipt(tenantId: TenantId, receiptId: ReceiptId): Promise<Receipt | null> {
    validate(TenantIdSchema, tenantId);
    return this.storage.getReceipt(tenantId, receiptId);
  }

  /**
   * Get a receipt by transaction ID
   */
  async getReceiptByTransaction(tenantId: TenantId, transactionId: TransactionId): Promise<Receipt | null> {
    validate(TenantIdSchema, tenantId);
    return this.storage.getReceiptByTransaction(tenantId, transactionId);
  }

  /**
   * Verify a receipt's integrity
   */
  async verifyReceipt(tenantId: TenantId, receiptId: ReceiptId): Promise<ReceiptVerificationResult> {
    validate(TenantIdSchema, tenantId);

    const receipt = await this.storage.getReceipt(tenantId, receiptId);

    if (!receipt) {
      return {
        valid: false,
        reason: 'Receipt not found',
      };
    }

    const isValid = verifyReceiptHash(receipt);

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
  async verifyReceiptByCode(tenantId: TenantId, receiptId: ReceiptId, code: string): Promise<ReceiptVerificationResult> {
    validate(TenantIdSchema, tenantId);

    const receipt = await this.storage.getReceipt(tenantId, receiptId);

    if (!receipt) {
      return {
        valid: false,
        reason: 'Receipt not found',
      };
    }

    const isValid = verifyWithCode(receipt, code);

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
  async getPublicReceiptData(tenantId: TenantId, receiptId: ReceiptId): Promise<PublicReceiptData | null> {
    validate(TenantIdSchema, tenantId);

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
  async voidReceipt(input: VoidReceiptInput): Promise<Receipt> {
    const validated = validate(VoidReceiptInputSchema, input);

    const receipt = await this.storage.getReceipt(validated.tenantId, validated.receiptId);

    if (!receipt) {
      throw new Error(`Receipt not found: ${validated.receiptId}`);
    }

    if (receipt.status !== ReceiptStatus.ISSUED) {
      throw new Error(`Cannot void receipt with status: ${receipt.status}`);
    }

    return this.storage.updateReceipt(validated.tenantId, validated.receiptId, {
      status: ReceiptStatus.VOIDED,
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
  async refundReceipt(input: RefundReceiptInput): Promise<Receipt> {
    const validated = validate(RefundReceiptInputSchema, input);

    const receipt = await this.storage.getReceipt(validated.tenantId, validated.receiptId);

    if (!receipt) {
      throw new Error(`Receipt not found: ${validated.receiptId}`);
    }

    if (receipt.status !== ReceiptStatus.ISSUED) {
      throw new Error(`Cannot refund receipt with status: ${receipt.status}`);
    }

    return this.storage.updateReceipt(validated.tenantId, validated.receiptId, {
      status: ReceiptStatus.REFUNDED,
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
  async listReceipts(tenantId: TenantId, limit = 100, offset = 0): Promise<Receipt[]> {
    validate(TenantIdSchema, tenantId);
    return this.storage.listReceipts(tenantId, limit, offset);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return randomBytes(16).toString('hex');
  }
}
