package com.erp.account.common.exception;

public class DuplicateBankAccountException extends BusinessException {

    public DuplicateBankAccountException(String message) {
        super(message, "DUPLICATE_BANK_ACCOUNT");
    }
}
