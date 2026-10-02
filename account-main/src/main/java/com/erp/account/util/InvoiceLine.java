package com.erp.account.util;

import java.math.BigDecimal;

public class InvoiceLine {
    private String accountCode;
    private String description;
    private BigDecimal taxableValue = BigDecimal.ZERO;
    private BigDecimal taxPercent = BigDecimal.ZERO;
    private BigDecimal taxAmount = BigDecimal.ZERO;
    private BigDecimal lineTotal = BigDecimal.ZERO;
    private String reference;

    public InvoiceLine() {}

    public InvoiceLine(String accountCode, String description, BigDecimal taxableValue, BigDecimal taxPercent, BigDecimal taxAmount, BigDecimal lineTotal, String reference) {
        this.accountCode = accountCode;
        this.description = description;
        this.taxableValue = taxableValue != null ? taxableValue : BigDecimal.ZERO;
        this.taxPercent = taxPercent != null ? taxPercent : BigDecimal.ZERO;
        this.taxAmount = taxAmount != null ? taxAmount : BigDecimal.ZERO;
        this.lineTotal = lineTotal != null ? lineTotal : BigDecimal.ZERO;
        this.reference = reference;
    }

    public String getAccountCode() { return accountCode; }
    public void setAccountCode(String accountCode) { this.accountCode = accountCode; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getTaxableValue() { return taxableValue; }
    public void setTaxableValue(BigDecimal taxableValue) { this.taxableValue = taxableValue != null ? taxableValue : BigDecimal.ZERO; }

    public BigDecimal getTaxPercent() { return taxPercent; }
    public void setTaxPercent(BigDecimal taxPercent) { this.taxPercent = taxPercent != null ? taxPercent : BigDecimal.ZERO; }

    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount != null ? taxAmount : BigDecimal.ZERO; }

    public BigDecimal getLineTotal() { return lineTotal; }
    public void setLineTotal(BigDecimal lineTotal) { this.lineTotal = lineTotal != null ? lineTotal : BigDecimal.ZERO; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }
}
