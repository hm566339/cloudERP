package com.erp.account.common.exception;

public class ValidationException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public ValidationException(String message) {
        super(message, "VALIDATION_ERROR");
    }

    public ValidationException(String message, String errorCode) {
        super(message, errorCode);
    }

    public ValidationException(String message, Throwable cause, String errorCode) {
        super(message, cause, errorCode);
    }

    public ValidationException(String message, Throwable cause) {
        super(message, cause, "VALIDATION_ERROR");
    }
}
