package com.erp.account.common.exception;

public class InvalidGstSlabException extends ValidationException {

    private static final long serialVersionUID = 1L;

    public InvalidGstSlabException(String message) {
        super(message, "INVALID_GST_SLAB");
    }

    public InvalidGstSlabException(String message, String errorCode) {
        super(message, errorCode);
    }

    public InvalidGstSlabException(String message, Throwable cause) {
        super(message, cause, "INVALID_GST_SLAB");
    }
}
