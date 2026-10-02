package com.erp.account.common.exception;

public class BadRequestException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public BadRequestException(String message) {
        super(message, "BAD_REQUEST");
    }

    public BadRequestException(String message, String errorCode) {
        super(message, errorCode);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause, "BAD_REQUEST");
    }
}
