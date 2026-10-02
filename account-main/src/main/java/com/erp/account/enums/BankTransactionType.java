package com.erp.account.enums;

/**
 * Enum for Bank Transaction Types
 * 
 * Supported transaction types:
 * - DEPOSIT: Money deposited to bank
 * - WITHDRAWAL: Money withdrawn from bank
 * - PAYMENT: Payment made from bank account
 * - RECEIPT: Receipt credited to bank account
 * - BANK_CHARGES: Bank charges/fees deducted
 * - INTEREST: Interest earned/accrued
 * - TRANSFER: Transfer between accounts/companies
 * - REVERSAL: Transaction reversal
 * 
 * @author ERP System
 * @version 1.0
 */
public enum BankTransactionType {
    DEPOSIT("Deposit"),
    WITHDRAWAL("Withdrawal"),
    PAYMENT("Payment"),
    RECEIPT("Receipt"),
    BANK_CHARGES("Bank Charges"),
    INTEREST("Interest"),
    TRANSFER("Transfer"),
    REVERSAL("Reversal");

    private final String displayName;

    BankTransactionType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
