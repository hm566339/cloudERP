package com.erp.communication.exception;

public class TemplateRenderingException extends RuntimeException {

    public TemplateRenderingException(String message) {
        super(message);
    }

    public TemplateRenderingException(String message, Throwable cause) {
        super(message, cause);
    }
}
