package com.erp.account.common.exception;

/**
 * Exception thrown for invalid bank transaction operations.
 * 
 * Covers validation failures like invalid amounts, debit/credit combinations, etc.
 * 
 * @author ERP System
 * @version 1.0
 */
public class InvalidBankTransactionException extends RuntimeException {

    private final String field;
    private final String value;

    public InvalidBankTransactionException(String message) {
        super(message);
        this.field = null;
        this.value = null;
    }

    public InvalidBankTransactionException(String field, String value, String message) {
        super(message);
        this.field = field;
        this.value = value;
    }

    public InvalidBankTransactionException(String message, Throwable cause) {
        super(message, cause);
        this.field = null;
        this.value = null;
    }

    public String getField() {
        return field;
    }

    public String getValue() {
        return value;
    }
}
