package com.erp.account.common.exception;

public class HsnSacNotFoundException extends ResourceNotFoundException {

    private static final long serialVersionUID = 1L;

    public HsnSacNotFoundException(String message) {
        super(message, "HSN_SAC_NOT_FOUND");
    }

    public HsnSacNotFoundException(String message, Throwable cause) {
        super(message, cause, "HSN_SAC_NOT_FOUND");
    }
}
