package com.erp.account.modules.quotation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationPublicViewResponse {
    private String quotationNumber;
    private LocalDate quotationDate;
    private LocalDate validUntil;
    private String status;
    private String currency;

    // Company Information
    private String companyName;
    private String companyLogoUrl;
    private String companyEmail;
    private String companyPhone;
    private String companyAddress;
    private String companyGstin;

    // Customer Information
    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String billingAddress;
    private String shippingAddress;
    private String customerGstin;

    // Items
    private List<QuotationPublicItemDto> items;

    // Totals & Tax Summary
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal taxAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal totalAmount;

    // Terms & Customer Notes
    private String termsAndConditions;
    private List<String> formattedTerms;
    private String notes;

    // Status Flags
    private boolean isExpired;
    private boolean isAccepted;
    private boolean isRejected;
    private LocalDateTime acceptedAt;
}

