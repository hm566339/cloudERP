package com.erp.auth_service.exception;

public class ServerConnectionFailedException extends RuntimeException {

    public ServerConnectionFailedException(String message) {
        super(message);
    }

    public ServerConnectionFailedException(String message, Throwable cause) {
        super(message, cause);
    }
}