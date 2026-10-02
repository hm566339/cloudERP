package com.erp.account.common.exception;

/**
 * Exception thrown when a bank transaction is not found.
 * 
 * @author ERP System
 * @version 1.0
 */
public class BankTransactionNotFoundException extends RuntimeException {

    private final String identifier;

    public BankTransactionNotFoundException(String identifier) {
        super("Bank transaction not found: " + identifier);
        this.identifier = identifier;
    }

    public BankTransactionNotFoundException(String identifier, Throwable cause) {
        super("Bank transaction not found: " + identifier, cause);
        this.identifier = identifier;
    }

    public String getIdentifier() {
        return identifier;
    }
}
