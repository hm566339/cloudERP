package com.erp.account.common.exception;

/**
 * Exception thrown when an invoice status transition is invalid.
 *
 * Reasons:
 * - Invalid state transition
 * - Cannot cancel paid invoice
 * - Cannot reject approved invoice
 */
public class InvalidInvoiceStatusException extends BusinessException {

    private static final String DEFAULT_ERROR_CODE = "INVALID_STATUS_TRANSITION";

    public InvalidInvoiceStatusException(
            String currentStatus,
            String targetStatus) {

        super(
                String.format(
                        "Cannot transition invoice from %s to %s",
                        currentStatus,
                        targetStatus),
                DEFAULT_ERROR_CODE);
    }

    public InvalidInvoiceStatusException(
            String currentStatus,
            String targetStatus,
            String errorCode) {

        super(
                String.format(
                        "Cannot transition invoice from %s to %s",
                        currentStatus,
                        targetStatus),
                errorCode);
    }

    public InvalidInvoiceStatusException(String message) {
        super(message, DEFAULT_ERROR_CODE);
    }
}
