package com.erp.account.common.exception;

/**
 * Exception thrown during invoice payment operations.
 *
 * Reasons:
 * - Payment exceeds outstanding amount
 * - Payment on cancelled invoice
 * - Payment amount validation failure
 * - Insufficient payment allocation
 */
public class InvoicePaymentException extends BusinessException {

    private static final String ERROR_CODE = "INVOICE_PAYMENT_FAILED";

    public InvoicePaymentException(String invoiceNo, String reason) {
        super(
                String.format(
                        "Payment operation failed for invoice %s: %s",
                        invoiceNo,
                        reason),
                ERROR_CODE);
    }

    public InvoicePaymentException(String message) {
        super(message, ERROR_CODE);
    }
}
