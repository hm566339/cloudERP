package com.erp.account.common.exception;

public class BudgetClosedException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public BudgetClosedException(String message) {
        super(message);
    }
}
