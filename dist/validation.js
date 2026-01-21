"use strict";
/**
 * Input validation schemas using Zod
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundReceiptInputSchema = exports.VoidReceiptInputSchema = exports.CreateReceiptInputSchema = exports.LineItemSchema = exports.CurrencySchema = exports.TransactionIdSchema = exports.UserIdSchema = exports.TenantIdSchema = void 0;
exports.validate = validate;
const zod_1 = require("zod");
/**
 * Tenant ID validation
 */
exports.TenantIdSchema = zod_1.z.string().min(1).max(255);
/**
 * User ID validation
 */
exports.UserIdSchema = zod_1.z.string().min(1).max(255);
/**
 * Transaction ID validation
 */
exports.TransactionIdSchema = zod_1.z.string().min(1).max(255);
/**
 * Currency code validation (ISO 4217)
 */
exports.CurrencySchema = zod_1.z.string().length(3).toUpperCase();
/**
 * Line item validation
 */
exports.LineItemSchema = zod_1.z.object({
    description: zod_1.z.string().min(1).max(500),
    quantity: zod_1.z.number().positive(),
    unitPrice: zod_1.z.number().nonnegative(),
    totalPrice: zod_1.z.number().nonnegative(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
/**
 * Create receipt input validation
 */
exports.CreateReceiptInputSchema = zod_1.z.object({
    tenantId: exports.TenantIdSchema,
    transactionId: exports.TransactionIdSchema,
    issuedBy: exports.UserIdSchema,
    lineItems: zod_1.z.array(exports.LineItemSchema).min(1),
    subtotal: zod_1.z.number().nonnegative(),
    tax: zod_1.z.number().nonnegative(),
    total: zod_1.z.number().nonnegative(),
    currency: exports.CurrencySchema,
    paymentMethod: zod_1.z.string().min(1).max(100),
    auditEventId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
}).refine((data) => data.subtotal + data.tax === data.total, {
    message: 'Total must equal subtotal + tax',
    path: ['total'],
});
/**
 * Void receipt input validation
 */
exports.VoidReceiptInputSchema = zod_1.z.object({
    tenantId: exports.TenantIdSchema,
    receiptId: zod_1.z.string().min(1),
    voidedBy: exports.UserIdSchema,
    reason: zod_1.z.string().min(1).max(500),
    auditEventId: zod_1.z.string().optional(),
});
/**
 * Refund receipt input validation
 */
exports.RefundReceiptInputSchema = zod_1.z.object({
    tenantId: exports.TenantIdSchema,
    receiptId: zod_1.z.string().min(1),
    refundedBy: exports.UserIdSchema,
    reason: zod_1.z.string().min(1).max(500),
    auditEventId: zod_1.z.string().optional(),
});
/**
 * Validate input against a schema
 */
function validate(schema, input) {
    return schema.parse(input);
}
//# sourceMappingURL=validation.js.map