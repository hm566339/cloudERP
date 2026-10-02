package com.erp.account.common.exception;

public class HsnSacInUseException extends ConflictException {

    private static final long serialVersionUID = 1L;

    public HsnSacInUseException(String message) {
        super(message, "HSN_SAC_IN_USE");
    }

    public HsnSacInUseException(String message, Throwable cause) {
        super(message, cause, "HSN_SAC_IN_USE");
    }
}
