package com.erp.account.enums;

public enum AccountCategoryType {

    AST("Assets"),
    LIA("Liabilities"),
    EQT("Equity"),
    INC("Income"),
    EXP("Expense");

    private final String displayName;

    AccountCategoryType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}