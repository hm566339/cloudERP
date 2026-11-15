package com.erp.crm.common.exception;

public class BadRequestException extends RuntimeException {
    private String errorCode;
    public BadRequestException(String message) { super(message); }
    public BadRequestException(String message, String errorCode) { super(message); this.errorCode = errorCode; }
    public BadRequestException(String message, Throwable cause) { super(message, cause); }
    public String getErrorCode() { return errorCode; }
}