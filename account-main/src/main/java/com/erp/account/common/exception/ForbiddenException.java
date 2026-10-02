package com.erp.account.common.exception;

public class ForbiddenException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public ForbiddenException(String message) {
        super(message, "FORBIDDEN");
    }

    public ForbiddenException(String message, String errorCode) {
        super(message, errorCode);
    }

    public ForbiddenException(String message, Throwable cause) {
        super(message, cause, "FORBIDDEN");
    }
}
