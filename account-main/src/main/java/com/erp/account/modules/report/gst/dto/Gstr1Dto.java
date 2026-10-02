package com.erp.account.modules.report.gst.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class Gstr1Dto {
    private String invoiceNumber;
    private LocalDate invoiceDate;
    private String customerName;
    private String gstin;
    private String state;
    private String placeOfSupply;
    private String invoiceType;
    private BigDecimal taxableAmount = BigDecimal.ZERO;
    private BigDecimal cgst = BigDecimal.ZERO;
    private BigDecimal sgst = BigDecimal.ZERO;
    private BigDecimal igst = BigDecimal.ZERO;
    private BigDecimal cess = BigDecimal.ZERO;
    private BigDecimal totalInvoiceValue = BigDecimal.ZERO;
    private String hsn;
    private BigDecimal gstRate;
    private String tableCategory;
    private Boolean reverseCharge;
}
