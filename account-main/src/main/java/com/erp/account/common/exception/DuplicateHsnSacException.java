package com.erp.account.common.exception;

public class DuplicateHsnSacException extends DuplicateResourceException {

    private static final long serialVersionUID = 1L;

    public DuplicateHsnSacException(String message) {
        super(message, "DUPLICATE_HSN_SAC");
    }

    public DuplicateHsnSacException(String message, Throwable cause) {
        super(message, cause, "DUPLICATE_HSN_SAC");
    }
}
