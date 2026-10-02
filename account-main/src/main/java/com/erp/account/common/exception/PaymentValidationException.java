package com.erp.account.common.exception;

public class PaymentValidationException extends BadRequestException {

    private static final long serialVersionUID = 1L;

    public PaymentValidationException(String message) {
        super(message, "PAYMENT_VALIDATION_ERROR");
    }
}
