package com.erp.account.common.exception;

public class InternalServerException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public InternalServerException(String message) {
        super(message, "INTERNAL_SERVER_ERROR");
    }

    public InternalServerException(String message, String errorCode) {
        super(message, errorCode);
    }

    public InternalServerException(String message, Throwable cause) {
        super(message, cause, "INTERNAL_SERVER_ERROR");
    }
}
