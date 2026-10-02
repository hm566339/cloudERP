package com.erp.account.common.exception;

public class InvalidPanException extends ValidationException {

    public InvalidPanException(String pan) {
        super("Invalid PAN format: " + pan + ". Expected format: 10 characters");
    }

    public InvalidPanException(String message, Throwable cause) {
        super(message, cause);
    }
}
