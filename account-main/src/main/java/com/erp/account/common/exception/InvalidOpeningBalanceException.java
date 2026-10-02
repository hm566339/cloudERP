package com.erp.account.common.exception;

public class InvalidOpeningBalanceException extends ValidationException {

    public InvalidOpeningBalanceException(String message) {
        super(message, "INVALID_OPENING_BALANCE");
    }
}
