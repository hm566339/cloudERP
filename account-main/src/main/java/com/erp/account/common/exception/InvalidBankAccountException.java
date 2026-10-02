package com.erp.account.common.exception;

import java.util.UUID;

/**
 * Exception thrown for invalid bank account operations.
 * 
 * @author ERP System
 * @version 1.0
 */
public class InvalidBankAccountException extends RuntimeException {

    private final UUID bankAccountId;
    private final String reason;

    public InvalidBankAccountException(UUID bankAccountId, String reason) {
        super("Invalid bank account " + bankAccountId + ": " + reason);
        this.bankAccountId = bankAccountId;
        this.reason = reason;
    }

    public UUID getBankAccountId() {
        return bankAccountId;
    }

    public String getReason() {
        return reason;
    }
}
