package com.erp.auth_service.exception;

public class SessionLimitExceededException extends RuntimeException {

    public SessionLimitExceededException(String message) {
        super(message);
    }
}