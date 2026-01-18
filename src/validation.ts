/**
 * Input validation schemas using Zod
 */

import { z } from 'zod';

/**
 * Tenant ID validation
 */
export const TenantIdSchema = z.string().min(1).max(255);

/**
 * User ID validation
 */
export const UserIdSchema = z.string().min(1).max(255);

/**
 * Transaction ID validation
 */
export const TransactionIdSchema = z.string().min(1).max(255);

/**
 * Currency code validation (ISO 4217)
 */
export const CurrencySchema = z.string().length(3).toUpperCase();

/**
 * Line item validation
 */
export const LineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Create receipt input validation
 */
export const CreateReceiptInputSchema = z.object({
  tenantId: TenantIdSchema,
  transactionId: TransactionIdSchema,
  issuedBy: UserIdSchema,
  lineItems: z.array(LineItemSchema).min(1),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  total: z.number().nonnegative(),
  currency: CurrencySchema,
  paymentMethod: z.string().min(1).max(100),
  auditEventId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => data.subtotal + data.tax === data.total,
  {
    message: 'Total must equal subtotal + tax',
    path: ['total'],
  }
);

/**
 * Void receipt input validation
 */
export const VoidReceiptInputSchema = z.object({
  tenantId: TenantIdSchema,
  receiptId: z.string().min(1),
  voidedBy: UserIdSchema,
  reason: z.string().min(1).max(500),
  auditEventId: z.string().optional(),
});

/**
 * Refund receipt input validation
 */
export const RefundReceiptInputSchema = z.object({
  tenantId: TenantIdSchema,
  receiptId: z.string().min(1),
  refundedBy: UserIdSchema,
  reason: z.string().min(1).max(500),
  auditEventId: z.string().optional(),
});

/**
 * Validate input against a schema
 */
export function validate<T>(schema: z.ZodSchema<T>, input: unknown): T {
  return schema.parse(input);
}
