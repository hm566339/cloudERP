package com.erp.account.common.exception;

public class ResourceNotFoundException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public ResourceNotFoundException(String message) {
        super(message, "RESOURCE_NOT_FOUND");
    }

    public ResourceNotFoundException(String message, String errorCode) {
        super(message, errorCode);
    }

    public ResourceNotFoundException(String message, Throwable cause, String errorCode) {
        super(message, cause, errorCode);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause, "RESOURCE_NOT_FOUND");
    }
}
