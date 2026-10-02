package com.erp.account.common.exception;

import java.util.UUID;

public class DuplicatePaymentException extends BusinessException {

    public DuplicatePaymentException(String paymentNo, UUID companyId) {
        super("AP payment number '" + paymentNo + "' already exists for company: " + companyId,
            "DUPLICATE_AP_PAYMENT");
    }
}
