package com.erp.account.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class Invoice {
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String customerAccountCode;
    private List<InvoiceLine> lines = new ArrayList<>();
    private BigDecimal totalAmount = BigDecimal.ZERO;
    private BigDecimal paidAmount = BigDecimal.ZERO;
    private BigDecimal outstandingAmount = BigDecimal.ZERO;
    private Integer accountingPeriod;

    public Invoice() {}

    public String getInvoiceNumber() { return invoiceNumber; }
    public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }

    public LocalDate getInvoiceDate() { return invoiceDate; }
    public void setInvoiceDate(LocalDate invoiceDate) { this.invoiceDate = invoiceDate; }

    public String getCustomerAccountCode() { return customerAccountCode; }
    public void setCustomerAccountCode(String customerAccountCode) { this.customerAccountCode = customerAccountCode; }

    public List<InvoiceLine> getLines() { return lines; }
    public void setLines(List<InvoiceLine> lines) { this.lines = lines; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount != null ? totalAmount : BigDecimal.ZERO; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount != null ? paidAmount : BigDecimal.ZERO; }

    public BigDecimal getOutstandingAmount() { return outstandingAmount; }
    public void setOutstandingAmount(BigDecimal outstandingAmount) { this.outstandingAmount = outstandingAmount != null ? outstandingAmount : BigDecimal.ZERO; }

    public Integer getAccountingPeriod() { return accountingPeriod; }
    public void setAccountingPeriod(Integer accountingPeriod) { this.accountingPeriod = accountingPeriod; }
}
