package com.erp.account.common.exception;

public class BudgetLineNotFoundException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public BudgetLineNotFoundException(String message) {
        super(message);
    }
}
