import { ReceiptService } from './receipt-service';
import { InMemoryReceiptStorage } from './storage';
import { CreateReceiptInput, ReceiptStatus, Receipt } from './types';
import { computeReceiptHash, verifyReceiptHash, generateVerificationCode, verifyWithCode } from './hash-utils';

describe('ReceiptService', () => {
  let service: ReceiptService;

  beforeEach(() => {
    service = new ReceiptService({
      storage: new InMemoryReceiptStorage(),
    });
  });

  describe('generateReceipt', () => {
    it('should generate a receipt with hash and verification code', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 2,
            unitPrice: 500,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 75,
        total: 1075,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const receipt = await service.generateReceipt(input);

      expect(receipt.receiptId).toBeDefined();
      expect(receipt.tenantId).toBe('tenant-1');
      expect(receipt.transactionId).toBe('txn-123');
      expect(receipt.status).toBe(ReceiptStatus.ISSUED);
      expect(receipt.hash).toBeDefined();
      expect(receipt.verificationCode).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
      expect(receipt.total).toBe(1075);
    });

    it('should reject invalid totals', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 75,
        total: 1000, // Should be 1075
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      await expect(service.generateReceipt(input)).rejects.toThrow();
    });

    it('should link to audit event', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
        auditEventId: 'audit-event-123',
      };

      const receipt = await service.generateReceipt(input);

      expect(receipt.auditEventId).toBe('audit-event-123');
    });
  });

  describe('getReceipt', () => {
    it('should retrieve a receipt by ID', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const generated = await service.generateReceipt(input);
      const retrieved = await service.getReceipt('tenant-1', generated.receiptId);

      expect(retrieved).toEqual(generated);
    });

    it('should enforce tenant isolation', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const generated = await service.generateReceipt(input);
      const retrieved = await service.getReceipt('tenant-2', generated.receiptId);

      expect(retrieved).toBeNull();
    });
  });

  describe('getReceiptByTransaction', () => {
    it('should retrieve a receipt by transaction ID', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const generated = await service.generateReceipt(input);
      const retrieved = await service.getReceiptByTransaction('tenant-1', 'txn-123');

      expect(retrieved).toEqual(generated);
    });
  });

  describe('verifyReceipt', () => {
    it('should verify a valid receipt', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const receipt = await service.generateReceipt(input);
      const verification = await service.verifyReceipt('tenant-1', receipt.receiptId);

      expect(verification.valid).toBe(true);
      expect(verification.receipt).toEqual(receipt);
    });

    it('should reject non-existent receipt', async () => {
      const verification = await service.verifyReceipt('tenant-1', 'non-existent');

      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('not found');
    });
  });

  describe('verifyReceiptByCode', () => {
    it('should verify a receipt using verification code', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const receipt = await service.generateReceipt(input);
      const verification = await service.verifyReceiptByCode(
        'tenant-1',
        receipt.receiptId,
        receipt.verificationCode
      );

      expect(verification.valid).toBe(true);
    });

    it('should reject incorrect verification code', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const receipt = await service.generateReceipt(input);
      const verification = await service.verifyReceiptByCode(
        'tenant-1',
        receipt.receiptId,
        'AAAA-BBBB'
      );

      expect(verification.valid).toBe(false);
      expect(verification.reason).toContain('does not match');
    });
  });

  describe('getPublicReceiptData', () => {
    it('should return public data without PII', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const receipt = await service.generateReceipt(input);
      const publicData = await service.getPublicReceiptData('tenant-1', receipt.receiptId);

      expect(publicData).toBeDefined();
      expect(publicData!.receiptId).toBe(receipt.receiptId);
      expect(publicData!.total).toBe(1000);
      expect(publicData!.verificationCode).toBe(receipt.verificationCode);
      // Should not contain PII like issuedBy, lineItems details, etc.
      expect(publicData).not.toHaveProperty('issuedBy');
      expect(publicData).not.toHaveProperty('lineItems');
    });
  });

  describe('voidReceipt', () => {
    it('should void an issued receipt', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const receipt = await service.generateReceipt(input);
      const voided = await service.voidReceipt({
        tenantId: 'tenant-1',
        receiptId: receipt.receiptId,
        voidedBy: 'user-2',
        reason: 'Customer request',
      });

      expect(voided.status).toBe(ReceiptStatus.VOIDED);
      expect(voided.metadata?.voidedBy).toBe('user-2');
      expect(voided.metadata?.voidReason).toBe('Customer request');
    });

    it('should preserve hash integrity after voiding (void does not destroy history)', async () => {
      const receipt = await service.generateReceipt({
        tenantId: 'tenant-1',
        transactionId: 'txn-void-hash',
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
      });

      const originalHash = receipt.hash;
      const originalCode = receipt.verificationCode;

      await service.voidReceipt({
        tenantId: 'tenant-1',
        receiptId: receipt.receiptId,
        voidedBy: 'user-2',
        reason: 'Test void',
      });

      const verification = await service.verifyReceipt('tenant-1', receipt.receiptId);
      expect(verification.valid).toBe(true);
      expect(verification.receipt?.hash).toBe(originalHash);

      const codeVerification = await service.verifyReceiptByCode('tenant-1', receipt.receiptId, originalCode);
      expect(codeVerification.valid).toBe(true);
    });

    it('should reject voiding a non-issued receipt', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const receipt = await service.generateReceipt(input);
      await service.voidReceipt({
        tenantId: 'tenant-1',
        receiptId: receipt.receiptId,
        voidedBy: 'user-2',
        reason: 'Test',
      });

      // Try to void again
      await expect(
        service.voidReceipt({
          tenantId: 'tenant-1',
          receiptId: receipt.receiptId,
          voidedBy: 'user-2',
          reason: 'Test',
        })
      ).rejects.toThrow('Cannot void receipt');
    });
  });

  describe('refundReceipt', () => {
    it('should mark a receipt as refunded', async () => {
      const input: CreateReceiptInput = {
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [
          {
            description: 'Product A',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000,
          },
        ],
        subtotal: 1000,
        tax: 0,
        total: 1000,
        currency: 'NGN',
        paymentMethod: 'cash',
      };

      const receipt = await service.generateReceipt(input);
      const refunded = await service.refundReceipt({
        tenantId: 'tenant-1',
        receiptId: receipt.receiptId,
        refundedBy: 'user-2',
        reason: 'Defective product',
      });

      expect(refunded.status).toBe(ReceiptStatus.REFUNDED);
      expect(refunded.metadata?.refundedBy).toBe('user-2');
      expect(refunded.metadata?.refundReason).toBe('Defective product');
    });

    it('should preserve hash integrity after refund (refund creates verifiable state transition)', async () => {
      const receipt = await service.generateReceipt({
        tenantId: 'tenant-1',
        transactionId: 'txn-refund-hash',
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
      });

      const originalHash = receipt.hash;
      const originalCode = receipt.verificationCode;

      await service.refundReceipt({
        tenantId: 'tenant-1',
        receiptId: receipt.receiptId,
        refundedBy: 'user-2',
        reason: 'Test refund',
      });

      const verification = await service.verifyReceipt('tenant-1', receipt.receiptId);
      expect(verification.valid).toBe(true);
      expect(verification.receipt?.hash).toBe(originalHash);
      expect(verification.receipt?.status).toBe(ReceiptStatus.REFUNDED);

      const codeVerification = await service.verifyReceiptByCode('tenant-1', receipt.receiptId, originalCode);
      expect(codeVerification.valid).toBe(true);
    });
  });

  describe('tenant isolation', () => {
    it('should enforce strict tenant boundaries', async () => {
      // Generate receipts in different tenants
      const receipt1 = await service.generateReceipt({
        tenantId: 'tenant-1',
        transactionId: 'txn-1',
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
      });

      const receipt2 = await service.generateReceipt({
        tenantId: 'tenant-2',
        transactionId: 'txn-2',
        issuedBy: 'user-1',
        lineItems: [{ description: 'B', quantity: 1, unitPrice: 200, totalPrice: 200 }],
        subtotal: 200,
        tax: 0,
        total: 200,
        currency: 'NGN',
        paymentMethod: 'cash',
      });

      // Verify isolation
      const retrieved1 = await service.getReceipt('tenant-1', receipt1.receiptId);
      const retrieved2 = await service.getReceipt('tenant-2', receipt2.receiptId);
      const crossRetrieve1 = await service.getReceipt('tenant-2', receipt1.receiptId);
      const crossRetrieve2 = await service.getReceipt('tenant-1', receipt2.receiptId);

      expect(retrieved1).toEqual(receipt1);
      expect(retrieved2).toEqual(receipt2);
      expect(crossRetrieve1).toBeNull();
      expect(crossRetrieve2).toBeNull();
    });
  });

  describe('listReceipts', () => {
    it('should list receipts for a tenant', async () => {
      await service.generateReceipt({
        tenantId: 'tenant-1',
        transactionId: 'txn-1',
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
      });

      await service.generateReceipt({
        tenantId: 'tenant-1',
        transactionId: 'txn-2',
        issuedBy: 'user-1',
        lineItems: [{ description: 'B', quantity: 1, unitPrice: 200, totalPrice: 200 }],
        subtotal: 200,
        tax: 0,
        total: 200,
        currency: 'NGN',
        paymentMethod: 'cash',
      });

      const receipts = await service.listReceipts('tenant-1');
      expect(receipts).toHaveLength(2);
    });
  });

  describe('getPublicReceiptData edge cases', () => {
    it('should return null for non-existent receipt', async () => {
      const publicData = await service.getPublicReceiptData('tenant-1', 'non-existent');
      expect(publicData).toBeNull();
    });
  });

  describe('voidReceipt edge cases', () => {
    it('should throw for non-existent receipt', async () => {
      await expect(
        service.voidReceipt({
          tenantId: 'tenant-1',
          receiptId: 'non-existent',
          voidedBy: 'user-1',
          reason: 'Test',
        })
      ).rejects.toThrow('Receipt not found');
    });
  });

  describe('refundReceipt edge cases', () => {
    it('should throw for non-existent receipt', async () => {
      await expect(
        service.refundReceipt({
          tenantId: 'tenant-1',
          receiptId: 'non-existent',
          refundedBy: 'user-1',
          reason: 'Test',
        })
      ).rejects.toThrow('Receipt not found');
    });

    it('should reject refunding a voided receipt', async () => {
      const receipt = await service.generateReceipt({
        tenantId: 'tenant-1',
        transactionId: 'txn-123',
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
      });

      await service.voidReceipt({
        tenantId: 'tenant-1',
        receiptId: receipt.receiptId,
        voidedBy: 'user-2',
        reason: 'Test',
      });

      await expect(
        service.refundReceipt({
          tenantId: 'tenant-1',
          receiptId: receipt.receiptId,
          refundedBy: 'user-2',
          reason: 'Test',
        })
      ).rejects.toThrow('Cannot refund receipt');
    });
  });

  describe('getReceiptByTransaction edge cases', () => {
    it('should return null for non-existent transaction', async () => {
      const receipt = await service.getReceiptByTransaction('tenant-1', 'non-existent');
      expect(receipt).toBeNull();
    });
  });
});

describe('Hash Utilities', () => {
  describe('computeReceiptHash', () => {
    it('should produce deterministic hashes for same content', () => {
      const receiptData: Omit<Receipt, 'hash'> = {
        receiptId: 'receipt-1',
        tenantId: 'tenant-1',
        transactionId: 'txn-1',
        status: ReceiptStatus.ISSUED,
        issuedAt: new Date('2024-01-01T00:00:00Z'),
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
        verificationCode: '',
      };

      const hash1 = computeReceiptHash(receiptData);
      const hash2 = computeReceiptHash(receiptData);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different content', () => {
      const receiptData1: Omit<Receipt, 'hash'> = {
        receiptId: 'receipt-1',
        tenantId: 'tenant-1',
        transactionId: 'txn-1',
        status: ReceiptStatus.ISSUED,
        issuedAt: new Date('2024-01-01T00:00:00Z'),
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
        verificationCode: '',
      };

      const receiptData2 = { ...receiptData1, total: 200 };

      const hash1 = computeReceiptHash(receiptData1);
      const hash2 = computeReceiptHash(receiptData2);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyReceiptHash', () => {
    it('should verify a valid receipt hash', () => {
      const receiptWithoutHash: Omit<Receipt, 'hash'> = {
        receiptId: 'receipt-1',
        tenantId: 'tenant-1',
        transactionId: 'txn-1',
        status: ReceiptStatus.ISSUED,
        issuedAt: new Date('2024-01-01T00:00:00Z'),
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
        verificationCode: '',
      };

      const hash = computeReceiptHash(receiptWithoutHash);
      const receipt: Receipt = { ...receiptWithoutHash, hash };

      expect(verifyReceiptHash(receipt)).toBe(true);
    });

    it('should detect tampered receipt', () => {
      const receiptWithoutHash: Omit<Receipt, 'hash'> = {
        receiptId: 'receipt-1',
        tenantId: 'tenant-1',
        transactionId: 'txn-1',
        status: ReceiptStatus.ISSUED,
        issuedAt: new Date('2024-01-01T00:00:00Z'),
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
        verificationCode: '',
      };

      const hash = computeReceiptHash(receiptWithoutHash);
      const receipt: Receipt = { ...receiptWithoutHash, hash, total: 999 }; // Tampered

      expect(verifyReceiptHash(receipt)).toBe(false);
    });
  });

  describe('generateVerificationCode', () => {
    it('should generate XXXX-XXXX format code', () => {
      const code = generateVerificationCode('abc123def456');
      expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    });
  });

  describe('verifyWithCode', () => {
    it('should verify correct code', () => {
      const receiptWithoutHash: Omit<Receipt, 'hash'> = {
        receiptId: 'receipt-1',
        tenantId: 'tenant-1',
        transactionId: 'txn-1',
        status: ReceiptStatus.ISSUED,
        issuedAt: new Date('2024-01-01T00:00:00Z'),
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
        verificationCode: '',
      };

      const hash = computeReceiptHash(receiptWithoutHash);
      const code = generateVerificationCode(hash);
      const receipt: Receipt = { ...receiptWithoutHash, hash, verificationCode: code };

      expect(verifyWithCode(receipt, code)).toBe(true);
      expect(verifyWithCode(receipt, code.toLowerCase())).toBe(true);
    });

    it('should reject incorrect code', () => {
      const receiptWithoutHash: Omit<Receipt, 'hash'> = {
        receiptId: 'receipt-1',
        tenantId: 'tenant-1',
        transactionId: 'txn-1',
        status: ReceiptStatus.ISSUED,
        issuedAt: new Date('2024-01-01T00:00:00Z'),
        issuedBy: 'user-1',
        lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
        subtotal: 100,
        tax: 0,
        total: 100,
        currency: 'NGN',
        paymentMethod: 'cash',
        verificationCode: '',
      };

      const hash = computeReceiptHash(receiptWithoutHash);
      const receipt: Receipt = { ...receiptWithoutHash, hash };

      expect(verifyWithCode(receipt, 'WRONG-CODE')).toBe(false);
    });
  });
});

describe('InMemoryReceiptStorage', () => {
  let storage: InMemoryReceiptStorage;

  beforeEach(() => {
    storage = new InMemoryReceiptStorage();
  });

  it('should reject duplicate receipt IDs', async () => {
    const receipt: Receipt = {
      receiptId: 'receipt-1',
      tenantId: 'tenant-1',
      transactionId: 'txn-1',
      status: ReceiptStatus.ISSUED,
      issuedAt: new Date(),
      issuedBy: 'user-1',
      lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
      subtotal: 100,
      tax: 0,
      total: 100,
      currency: 'NGN',
      paymentMethod: 'cash',
      hash: 'abc123',
      verificationCode: 'ABCD-1234',
    };

    await storage.createReceipt(receipt);
    await expect(storage.createReceipt(receipt)).rejects.toThrow('Receipt already exists');
  });

  it('should reject duplicate transaction IDs for same tenant', async () => {
    const receipt1: Receipt = {
      receiptId: 'receipt-1',
      tenantId: 'tenant-1',
      transactionId: 'txn-1',
      status: ReceiptStatus.ISSUED,
      issuedAt: new Date(),
      issuedBy: 'user-1',
      lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
      subtotal: 100,
      tax: 0,
      total: 100,
      currency: 'NGN',
      paymentMethod: 'cash',
      hash: 'abc123',
      verificationCode: 'ABCD-1234',
    };

    const receipt2: Receipt = {
      ...receipt1,
      receiptId: 'receipt-2',
    };

    await storage.createReceipt(receipt1);
    await expect(storage.createReceipt(receipt2)).rejects.toThrow('Receipt already exists for transaction');
  });

  it('should throw when updating non-existent receipt', async () => {
    await expect(
      storage.updateReceipt('tenant-1', 'non-existent', { status: ReceiptStatus.VOIDED })
    ).rejects.toThrow('Receipt not found');
  });

  it('should list receipts sorted by date', async () => {
    const oldDate = new Date('2024-01-01');
    const newDate = new Date('2024-06-01');

    const receipt1: Receipt = {
      receiptId: 'receipt-1',
      tenantId: 'tenant-1',
      transactionId: 'txn-1',
      status: ReceiptStatus.ISSUED,
      issuedAt: oldDate,
      issuedBy: 'user-1',
      lineItems: [{ description: 'A', quantity: 1, unitPrice: 100, totalPrice: 100 }],
      subtotal: 100,
      tax: 0,
      total: 100,
      currency: 'NGN',
      paymentMethod: 'cash',
      hash: 'abc123',
      verificationCode: 'ABCD-1234',
    };

    const receipt2: Receipt = {
      ...receipt1,
      receiptId: 'receipt-2',
      transactionId: 'txn-2',
      issuedAt: newDate,
    };

    await storage.createReceipt(receipt1);
    await storage.createReceipt(receipt2);

    const list = await storage.listReceipts('tenant-1');
    expect(list[0].receiptId).toBe('receipt-2'); // Newer first
    expect(list[1].receiptId).toBe('receipt-1');
  });
});

describe('HARD STOP CONDITION TEST', () => {
  it('A Suite can generate a receipt for a transaction and later prove—cryptographically and deterministically—that the transaction occurred, has not been tampered with, belongs to the correct tenant, and can be publicly verified without exposing PII', async () => {
    const storage = new InMemoryReceiptStorage();
    const service = new ReceiptService({ storage });

    const suiteA_tenantId = 'pos-suite-tenant-123';
    const suiteB_tenantId = 'different-tenant-456';

    const receipt = await service.generateReceipt({
      tenantId: suiteA_tenantId,
      transactionId: 'sale-txn-001',
      issuedBy: 'cashier-user-42',
      lineItems: [
        { description: 'Coffee', quantity: 2, unitPrice: 350, totalPrice: 700 },
        { description: 'Pastry', quantity: 1, unitPrice: 500, totalPrice: 500 },
      ],
      subtotal: 1200,
      tax: 60,
      total: 1260,
      currency: 'NGN',
      paymentMethod: 'cash',
      auditEventId: 'audit-event-abc',
    });

    expect(receipt.receiptId).toBeDefined();
    expect(receipt.hash).toBeDefined();
    expect(receipt.verificationCode).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);

    const verification = await service.verifyReceipt(suiteA_tenantId, receipt.receiptId);
    expect(verification.valid).toBe(true);
    expect(verification.receipt).toBeDefined();

    const storedReceipt = await service.getReceipt(suiteA_tenantId, receipt.receiptId);
    expect(storedReceipt).not.toBeNull();
    const isHashValid = verifyReceiptHash(storedReceipt!);
    expect(isHashValid).toBe(true);

    const tamperedReceipt: Receipt = { ...storedReceipt!, total: 9999 };
    const isTamperedValid = verifyReceiptHash(tamperedReceipt);
    expect(isTamperedValid).toBe(false);

    const crossTenantRetrieve = await service.getReceipt(suiteB_tenantId, receipt.receiptId);
    expect(crossTenantRetrieve).toBeNull();

    const crossTenantVerify = await service.verifyReceipt(suiteB_tenantId, receipt.receiptId);
    expect(crossTenantVerify.valid).toBe(false);

    const publicData = await service.getPublicReceiptData(suiteA_tenantId, receipt.receiptId);
    expect(publicData).not.toBeNull();
    expect(publicData!.total).toBe(1260);
    expect(publicData!.currency).toBe('NGN');
    expect(publicData!.verificationCode).toBe(receipt.verificationCode);
    expect(publicData!.status).toBe(ReceiptStatus.ISSUED);

    expect(publicData).not.toHaveProperty('tenantId');
    expect(publicData).not.toHaveProperty('issuedBy');
    expect(publicData).not.toHaveProperty('lineItems');
    expect(publicData).not.toHaveProperty('metadata');

    const codeVerification = await service.verifyReceiptByCode(
      suiteA_tenantId,
      receipt.receiptId,
      receipt.verificationCode
    );
    expect(codeVerification.valid).toBe(true);

    const sameReceipt = await service.getReceipt(suiteA_tenantId, receipt.receiptId);
    const recomputedHash = computeReceiptHash({
      ...sameReceipt!,
      hash: undefined as unknown as string,
    } as Omit<Receipt, 'hash'>);
    expect(recomputedHash).toBe(receipt.hash);
  });
});
