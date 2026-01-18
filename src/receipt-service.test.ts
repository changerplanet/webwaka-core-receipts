import { ReceiptService } from './receipt-service';
import { InMemoryReceiptStorage } from './storage';
import { CreateReceiptInput, ReceiptStatus } from './types';

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
});
