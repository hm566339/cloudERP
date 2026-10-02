package com.erp.account.common.exception;

public class InvalidUpiIdException extends ValidationException {

    public InvalidUpiIdException(String message) {
        super(message, "INVALID_UPI_ID");
    }
}
