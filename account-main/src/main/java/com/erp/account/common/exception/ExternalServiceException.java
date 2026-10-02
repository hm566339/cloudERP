package com.erp.account.common.exception;

public class ExternalServiceException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public ExternalServiceException(String message) {
        super(message, "EXTERNAL_SERVICE_ERROR");
    }

    public ExternalServiceException(String message, String errorCode) {
        super(message, errorCode);
    }

    public ExternalServiceException(String message, Throwable cause) {
        super(message, cause, "EXTERNAL_SERVICE_ERROR");
    }
}
