package com.erp.account.common.exception;

public class InvalidTaxApplicabilityException extends ValidationException {

    private static final long serialVersionUID = 1L;

    public InvalidTaxApplicabilityException(String message) {
        super(message, "INVALID_TAX_APPLICABILITY");
    }

    public InvalidTaxApplicabilityException(String message, Throwable cause) {
        super(message, cause, "INVALID_TAX_APPLICABILITY");
    }
}
