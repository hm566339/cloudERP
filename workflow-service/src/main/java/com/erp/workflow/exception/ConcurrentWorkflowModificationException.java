package com.erp.workflow.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class ConcurrentWorkflowModificationException extends RuntimeException {
    public ConcurrentWorkflowModificationException(String message) {
        super(message);
    }
}
