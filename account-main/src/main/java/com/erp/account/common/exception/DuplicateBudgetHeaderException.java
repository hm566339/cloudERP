package com.erp.account.common.exception;

public class DuplicateBudgetHeaderException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public DuplicateBudgetHeaderException(String message) {
        super(message);
    }
}
