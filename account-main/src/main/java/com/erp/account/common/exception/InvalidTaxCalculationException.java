package com.erp.account.common.exception;

/**
 * Exception thrown when tax calculations are invalid
 * 
 * Reasons:
 * - Tax amount doesn't match calculated value
 * - Invalid GST percentage
 * - GSTIN validation failed
 * - Tax precision mismatch
 */
public class InvalidTaxCalculationException extends BusinessException {
    public InvalidTaxCalculationException(String reason) {
        super("Tax calculation error: " + reason, "INVALID_TAX_CALCULATION");
    }

    public InvalidTaxCalculationException(String message, String errorCode) {
        super(message, errorCode);
    }
}
