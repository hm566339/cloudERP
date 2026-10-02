package com.erp.account.common.exception;

import java.util.UUID;

public class ApPaymentNotFoundException extends ResourceNotFoundException {

    private static final long serialVersionUID = 1L;

    public ApPaymentNotFoundException(UUID paymentId) {
        super("AP Payment not found with ID: " + paymentId, "AP_PAYMENT_NOT_FOUND");
    }

    public ApPaymentNotFoundException(String message, String errorCode) {
        super(message, errorCode);
    }
}
