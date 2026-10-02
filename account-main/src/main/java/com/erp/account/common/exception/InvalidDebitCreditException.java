package com.erp.account.common.exception;

/**
 * Exception thrown for invalid debit/credit combinations in bank transactions.
 * 
 * @author ERP System
 * @version 1.0
 */
public class InvalidDebitCreditException extends InvalidBankTransactionException {

    private final String debitAmount;
    private final String creditAmount;

    public InvalidDebitCreditException(String message, String debitAmount, String creditAmount) {
        super(message);
        this.debitAmount = debitAmount;
        this.creditAmount = creditAmount;
    }

    public String getDebitAmount() {
        return debitAmount;
    }

    public String getCreditAmount() {
        return creditAmount;
    }
}
