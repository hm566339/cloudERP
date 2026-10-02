package com.erp.account.common.exception;

public class InvalidHsnSacFormatException extends ValidationException {

    private static final long serialVersionUID = 1L;

    public InvalidHsnSacFormatException(String message) {
        super(message, "INVALID_HSN_SAC_FORMAT");
    }

    public InvalidHsnSacFormatException(String message, Throwable cause) {
        super(message, cause, "INVALID_HSN_SAC_FORMAT");
    }
}
