package com.erp.account.common.exception;

public class InvalidIfscCodeException extends ValidationException {

    public InvalidIfscCodeException(String message) {
        super(message, "INVALID_IFSC_CODE");
    }
}
