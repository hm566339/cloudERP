package com.erp.account.common.exception;

import java.io.Serializable;

public abstract class BaseApplicationException extends RuntimeException implements Serializable {

    private static final long serialVersionUID = 1L;

    private final String errorCode;

    protected BaseApplicationException(String message) {
        this(message, null, null);
    }

    protected BaseApplicationException(String message, String errorCode) {
        this(message, null, errorCode);
    }

    protected BaseApplicationException(String message, Throwable cause, String errorCode) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
