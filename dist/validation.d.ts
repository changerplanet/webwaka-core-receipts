/**
 * Input validation schemas using Zod
 */
import { z } from 'zod';
/**
 * Tenant ID validation
 */
export declare const TenantIdSchema: z.ZodString;
/**
 * User ID validation
 */
export declare const UserIdSchema: z.ZodString;
/**
 * Transaction ID validation
 */
export declare const TransactionIdSchema: z.ZodString;
/**
 * Currency code validation (ISO 4217)
 */
export declare const CurrencySchema: z.ZodString;
/**
 * Line item validation
 */
export declare const LineItemSchema: z.ZodObject<{
    description: z.ZodString;
    quantity: z.ZodNumber;
    unitPrice: z.ZodNumber;
    totalPrice: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    metadata?: Record<string, unknown> | undefined;
}, {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Create receipt input validation
 */
export declare const CreateReceiptInputSchema: z.ZodEffects<z.ZodObject<{
    tenantId: z.ZodString;
    transactionId: z.ZodString;
    issuedBy: z.ZodString;
    lineItems: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        quantity: z.ZodNumber;
        unitPrice: z.ZodNumber;
        totalPrice: z.ZodNumber;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        metadata?: Record<string, unknown> | undefined;
    }, {
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        metadata?: Record<string, unknown> | undefined;
    }>, "many">;
    subtotal: z.ZodNumber;
    tax: z.ZodNumber;
    total: z.ZodNumber;
    currency: z.ZodString;
    paymentMethod: z.ZodString;
    auditEventId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    tenantId: string;
    transactionId: string;
    issuedBy: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        metadata?: Record<string, unknown> | undefined;
    }[];
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    paymentMethod: string;
    auditEventId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    tenantId: string;
    transactionId: string;
    issuedBy: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        metadata?: Record<string, unknown> | undefined;
    }[];
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    paymentMethod: string;
    auditEventId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>, {
    tenantId: string;
    transactionId: string;
    issuedBy: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        metadata?: Record<string, unknown> | undefined;
    }[];
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    paymentMethod: string;
    auditEventId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    tenantId: string;
    transactionId: string;
    issuedBy: string;
    lineItems: {
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        metadata?: Record<string, unknown> | undefined;
    }[];
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    paymentMethod: string;
    auditEventId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
/**
 * Void receipt input validation
 */
export declare const VoidReceiptInputSchema: z.ZodObject<{
    tenantId: z.ZodString;
    receiptId: z.ZodString;
    voidedBy: z.ZodString;
    reason: z.ZodString;
    auditEventId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    receiptId: string;
    tenantId: string;
    voidedBy: string;
    reason: string;
    auditEventId?: string | undefined;
}, {
    receiptId: string;
    tenantId: string;
    voidedBy: string;
    reason: string;
    auditEventId?: string | undefined;
}>;
/**
 * Refund receipt input validation
 */
export declare const RefundReceiptInputSchema: z.ZodObject<{
    tenantId: z.ZodString;
    receiptId: z.ZodString;
    refundedBy: z.ZodString;
    reason: z.ZodString;
    auditEventId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    receiptId: string;
    tenantId: string;
    reason: string;
    refundedBy: string;
    auditEventId?: string | undefined;
}, {
    receiptId: string;
    tenantId: string;
    reason: string;
    refundedBy: string;
    auditEventId?: string | undefined;
}>;
/**
 * Validate input against a schema
 */
export declare function validate<T>(schema: z.ZodSchema<T>, input: unknown): T;
//# sourceMappingURL=validation.d.ts.map