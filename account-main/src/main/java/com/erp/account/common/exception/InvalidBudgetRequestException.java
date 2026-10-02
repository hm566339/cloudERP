package com.erp.account.common.exception;

public class InvalidBudgetRequestException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public InvalidBudgetRequestException(String message) {
        super(message);
    }
}
