package com.erp.account.util;

import java.math.BigDecimal;

public class AccountCategoryBalance {
    private String accountCode;
    private String accountName;
    private String category; // ASSET, LIABILITY, EQUITY, etc.
    private BigDecimal openingBalance = BigDecimal.ZERO;
    private BigDecimal debit = BigDecimal.ZERO;
    private BigDecimal credit = BigDecimal.ZERO;
    private BigDecimal closingBalance = BigDecimal.ZERO;

    public String getAccountCode() { return accountCode; }
    public void setAccountCode(String accountCode) { this.accountCode = accountCode; }

    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public BigDecimal getOpeningBalance() { return openingBalance; }
    public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance != null ? openingBalance : BigDecimal.ZERO; }

    public BigDecimal getDebit() { return debit; }
    public void setDebit(BigDecimal debit) { this.debit = debit != null ? debit : BigDecimal.ZERO; }

    public BigDecimal getCredit() { return credit; }
    public void setCredit(BigDecimal credit) { this.credit = credit != null ? credit : BigDecimal.ZERO; }

    public BigDecimal getClosingBalance() { return closingBalance; }
    public void setClosingBalance(BigDecimal closingBalance) { this.closingBalance = closingBalance != null ? closingBalance : BigDecimal.ZERO; }
}
