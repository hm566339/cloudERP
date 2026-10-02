package com.erp.account.common.exception;

/**
 * Exception thrown when posting to a closed accounting period
 * 
 * Reasons:
 * - Accounting period is closed
 * - Fiscal year is closed
 * - No active period for invoice date
 */
public class ClosedPeriodException extends BusinessException {
    public ClosedPeriodException(String periodName) {
        super("Accounting period '" + periodName + "' is closed and does not allow new transactions", 
              "CLOSED_PERIOD");
    }

    public ClosedPeriodException(String message, String errorCode) {
        super(message, errorCode);
    }
}
