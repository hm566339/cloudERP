package com.erp.account.common.exception;

public class BusinessException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public BusinessException(String message) {
        super(message, "BUSINESS_ERROR");
    }

    public BusinessException(String message, String errorCode) {
        super(message, errorCode);
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause, "BUSINESS_ERROR");
    }
}
