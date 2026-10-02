package com.erp.account.common.exception;

import java.math.BigDecimal;
import java.util.UUID;

public class CreditLimitExceededException extends BusinessException {

    public CreditLimitExceededException(
            UUID vendorId,
            BigDecimal creditLimit,
            BigDecimal outstandingAmount) {

        super(
                "Credit limit exceeded for vendor ID: " + vendorId +
                        ". Credit Limit: " + creditLimit +
                        ", Outstanding Amount: " + outstandingAmount);
    }

    public CreditLimitExceededException(
            String vendorCode,
            BigDecimal creditLimit,
            BigDecimal exceededAmount) {

        super(
                "Credit limit exceeded for vendor: " + vendorCode +
                        ". Credit Limit: " + creditLimit +
                        ", Exceeded Amount: " + exceededAmount);
    }
}
