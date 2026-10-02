package com.erp.account.common.exception;

public class InvalidOperationException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public InvalidOperationException(String message) {
        super(message, "INVALID_OPERATION");
    }

    public InvalidOperationException(String message, String errorCode) {
        super(message, errorCode);
    }

    public InvalidOperationException(String message, Throwable cause) {
        super(message, cause, "INVALID_OPERATION");
    }
}
