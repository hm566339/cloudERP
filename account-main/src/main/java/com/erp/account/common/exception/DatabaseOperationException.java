package com.erp.account.common.exception;

public class DatabaseOperationException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public DatabaseOperationException(String message) {
        super(message, "DATABASE_OPERATION_ERROR");
    }

    public DatabaseOperationException(String message, String errorCode) {
        super(message, errorCode);
    }

    public DatabaseOperationException(String message, Throwable cause) {
        super(message, cause, "DATABASE_OPERATION_ERROR");
    }
}
