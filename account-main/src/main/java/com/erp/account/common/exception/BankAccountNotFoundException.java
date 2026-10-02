package com.erp.account.common.exception;

public class BankAccountNotFoundException extends ResourceNotFoundException {

    public BankAccountNotFoundException(String message) {
        super(message, "BANK_ACCOUNT_NOT_FOUND");
    }
}
