package com.erp.account.util;

import java.math.BigDecimal;

public class GLEntry {
    private String account;
    private BigDecimal debit = BigDecimal.ZERO;
    private BigDecimal credit = BigDecimal.ZERO;
    private String currency;
    private String narration;

    public GLEntry() {}

    public GLEntry(String account, BigDecimal debit, BigDecimal credit, String currency, String narration) {
        this.account = account;
        this.debit = debit != null ? debit : BigDecimal.ZERO;
        this.credit = credit != null ? credit : BigDecimal.ZERO;
        this.currency = currency;
        this.narration = narration;
    }

    public String getAccount() { return account; }
    public void setAccount(String account) { this.account = account; }

    public BigDecimal getDebit() { return debit; }
    public void setDebit(BigDecimal debit) { this.debit = debit != null ? debit : BigDecimal.ZERO; }

    public BigDecimal getCredit() { return credit; }
    public void setCredit(BigDecimal credit) { this.credit = credit != null ? credit : BigDecimal.ZERO; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getNarration() { return narration; }
    public void setNarration(String narration) { this.narration = narration; }
}
