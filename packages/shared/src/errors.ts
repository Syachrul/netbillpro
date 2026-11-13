/** Kode error standar (subset TDD 24.3). Dipakai API dan uji. */

export const ErrorCode = {
  // Auth
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_LOCKED: 'AUTH_LOCKED',
  FORBIDDEN_ROLE: 'FORBIDDEN_ROLE',
  // Umum
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  // Payment (SPEC-LEDGER 7.1)
  PAYMENT_AMOUNT_INVALID: 'PAYMENT_AMOUNT_INVALID',
  PAYMENT_DATE_FUTURE: 'PAYMENT_DATE_FUTURE',
  PAYMENT_DUPLICATE_SUSPECTED: 'PAYMENT_DUPLICATE_SUSPECTED',
  IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
  IDEMPOTENCY_KEY_REQUIRED: 'IDEMPOTENCY_KEY_REQUIRED',
  // Invoice
  INVOICE_ALREADY_EXISTS: 'INVOICE_ALREADY_EXISTS',
  INVOICE_VOIDED: 'INVOICE_VOIDED',
  INVOICE_TOTAL_INVALID: 'INVOICE_TOTAL_INVALID',
  // Void
  ALREADY_VOIDED: 'ALREADY_VOIDED',
  SETTLEMENT_CONFIRMED: 'SETTLEMENT_CONFIRMED',
  // Approval
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, httpStatus = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}
