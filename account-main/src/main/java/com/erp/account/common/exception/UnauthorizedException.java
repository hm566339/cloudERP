package com.erp.account.common.exception;

public class UnauthorizedException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public UnauthorizedException(String message) {
        super(message, "UNAUTHORIZED");
    }

    public UnauthorizedException(String message, String errorCode) {
        super(message, errorCode);
    }

    public UnauthorizedException(String message, Throwable cause) {
        super(message, cause, "UNAUTHORIZED");
    }
}
