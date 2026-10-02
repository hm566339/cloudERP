package com.erp.account.common.exception;

public class InvalidBudgetStatusException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public InvalidBudgetStatusException(String message) {
        super(message);
    }
}
