package com.erp.account.common.exception;

public class DuplicateResourceException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public DuplicateResourceException(String message) {
        super(message, "DUPLICATE_RESOURCE");
    }

    public DuplicateResourceException(String message, String errorCode) {
        super(message, errorCode);
    }

    public DuplicateResourceException(String message, Throwable cause, String errorCode) {
        super(message, cause, errorCode);
    }

    public DuplicateResourceException(String message, Throwable cause) {
        super(message, cause, "DUPLICATE_RESOURCE");
    }
}
