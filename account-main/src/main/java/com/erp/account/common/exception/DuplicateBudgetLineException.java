package com.erp.account.common.exception;

public class DuplicateBudgetLineException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public DuplicateBudgetLineException(String message) {
        super(message);
    }
}
