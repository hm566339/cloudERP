package com.erp.account.common.exception;

public class InvalidGstinException extends ValidationException {

    public InvalidGstinException(String gstin) {
        super("Invalid GSTIN format: " + gstin + ". Expected format: 15 characters");
    }

    public InvalidGstinException(String message, Throwable cause) {
        super(message, cause);
    }
}
