package com.erp.account.common.exception;

import java.util.UUID;

public class ReconciliationException extends BusinessException {

    public ReconciliationException(String message) {
        super(message, "RECONCILIATION_ERROR");
    }

    public ReconciliationException(UUID transactionId, String message) {
        super(String.format("Transaction %s: %s", transactionId, message), "RECONCILIATION_ERROR");
    }
}
