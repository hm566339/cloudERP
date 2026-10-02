package com.erp.account.common.exception;

import lombok.Getter;

@Getter
public class BusinessValidationException extends RuntimeException {
    private final String errorCode;
    private final String field;

    public BusinessValidationException(String errorCode, String field, String message) {
        super(message);
        this.errorCode = errorCode;
        this.field = field;
    }
}
