package com.erp.communication.exception;

import com.erp.communication.entity.NotificationRequest;
import lombok.Getter;

@Getter
public class IdempotencyConflictException extends RuntimeException {

    private final NotificationRequest existingRequest;

    public IdempotencyConflictException(String message, NotificationRequest existingRequest) {
        super(message);
        this.existingRequest = existingRequest;
    }
}
