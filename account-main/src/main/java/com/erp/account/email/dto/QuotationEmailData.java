package com.erp.account.email.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class QuotationEmailData {
    private String customerName;
    private String quotationNumber;
    private LocalDate quotationDate;
    private LocalDate validUntil;
    private BigDecimal totalAmount;
    
    private String companyName;
    private String companyEmail;
    private String companyPhone;
    private String companyAddress;
    private String companyLogo;
    
    private String currency;
    private String gstin;
    private String referenceNumber;
    private String acceptUrl;
}
