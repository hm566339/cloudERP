package com.erp.account.common.exception;

public class BankAccountInUseException extends BusinessException {

    public BankAccountInUseException(String message) {
        super(message, "BANK_ACCOUNT_IN_USE");
    }
}
