package com.erp.account.common.exception;

public class ConflictException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public ConflictException(String message) {
        super(message, "CONFLICT_ERROR");
    }

    public ConflictException(String message, String errorCode) {
        super(message, errorCode);
    }

    public ConflictException(String message, Throwable cause, String errorCode) {
        super(message, cause, errorCode);
    }

    public ConflictException(String message, Throwable cause) {
        super(message, cause, "CONFLICT_ERROR");
    }
}
