"use strict";
/**
 * WebWaka Core Receipts Service
 *
 * Provides receipt generation, verification, and proof of economic activity.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefundReceiptInputSchema = exports.VoidReceiptInputSchema = exports.CreateReceiptInputSchema = exports.LineItemSchema = exports.CurrencySchema = exports.TransactionIdSchema = exports.UserIdSchema = exports.TenantIdSchema = exports.validate = exports.verifyWithCode = exports.generateVerificationCode = exports.verifyReceiptHash = exports.computeReceiptHash = exports.InMemoryReceiptStorage = exports.ReceiptStatus = exports.ReceiptService = void 0;
// Main service
var receipt_service_1 = require("./receipt-service");
Object.defineProperty(exports, "ReceiptService", { enumerable: true, get: function () { return receipt_service_1.ReceiptService; } });
// Types
var types_1 = require("./types");
Object.defineProperty(exports, "ReceiptStatus", { enumerable: true, get: function () { return types_1.ReceiptStatus; } });
// Storage interfaces
var storage_1 = require("./storage");
Object.defineProperty(exports, "InMemoryReceiptStorage", { enumerable: true, get: function () { return storage_1.InMemoryReceiptStorage; } });
// Hash utilities
var hash_utils_1 = require("./hash-utils");
Object.defineProperty(exports, "computeReceiptHash", { enumerable: true, get: function () { return hash_utils_1.computeReceiptHash; } });
Object.defineProperty(exports, "verifyReceiptHash", { enumerable: true, get: function () { return hash_utils_1.verifyReceiptHash; } });
Object.defineProperty(exports, "generateVerificationCode", { enumerable: true, get: function () { return hash_utils_1.generateVerificationCode; } });
Object.defineProperty(exports, "verifyWithCode", { enumerable: true, get: function () { return hash_utils_1.verifyWithCode; } });
// Validation
var validation_1 = require("./validation");
Object.defineProperty(exports, "validate", { enumerable: true, get: function () { return validation_1.validate; } });
Object.defineProperty(exports, "TenantIdSchema", { enumerable: true, get: function () { return validation_1.TenantIdSchema; } });
Object.defineProperty(exports, "UserIdSchema", { enumerable: true, get: function () { return validation_1.UserIdSchema; } });
Object.defineProperty(exports, "TransactionIdSchema", { enumerable: true, get: function () { return validation_1.TransactionIdSchema; } });
Object.defineProperty(exports, "CurrencySchema", { enumerable: true, get: function () { return validation_1.CurrencySchema; } });
Object.defineProperty(exports, "LineItemSchema", { enumerable: true, get: function () { return validation_1.LineItemSchema; } });
Object.defineProperty(exports, "CreateReceiptInputSchema", { enumerable: true, get: function () { return validation_1.CreateReceiptInputSchema; } });
Object.defineProperty(exports, "VoidReceiptInputSchema", { enumerable: true, get: function () { return validation_1.VoidReceiptInputSchema; } });
Object.defineProperty(exports, "RefundReceiptInputSchema", { enumerable: true, get: function () { return validation_1.RefundReceiptInputSchema; } });
//# sourceMappingURL=index.js.map