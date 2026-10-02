package com.erp.account.enums;

/**
 * Represents the fundamental accounting balance nature of an account.
 * This determines:
 * - The normal balance side (DEBIT or CREDIT)
 * - How account balances affect financial statements
 * - Posting rules and validation logic
 * 
 * This enum follows GAAP/IFRS standards and is consistent with SAP,
 * Oracle ERP, Microsoft Dynamics, and Tally accounting practices.
 * 
 * DEBIT: Asset, Expense, Contra-Liability/Equity accounts
 * CREDIT: Liability, Equity, Income, Contra-Asset/Expense accounts
 */
public enum AccountNature {
    /**
     * Accounts with normal DEBIT balance.
     * These accounts increase when debited (e.g., Assets, Expenses).
     */
    DEBIT("Debit"),
    
    /**
     * Accounts with normal CREDIT balance.
     * These accounts increase when credited (e.g., Liabilities, Income).
     */
    CREDIT("Credit");

    private final String displayName;

    AccountNature(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
