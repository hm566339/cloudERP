package com.erp.account.common.exception;

public class BudgetExceededException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public BudgetExceededException(String message) {
        super(message);
    }
}
