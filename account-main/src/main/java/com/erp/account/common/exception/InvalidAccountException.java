package com.erp.account.common.exception;

public class InvalidAccountException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public InvalidAccountException(String message) {
        super(message);
    }
}
