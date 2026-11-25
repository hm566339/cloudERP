package com.erp.communication.chat.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotationRequestMetadata {
    private String clientName;
    private String clientPhone;
    private String clientEmail;
    private String requirement;
    private String items;
    private BigDecimal estimatedAmount;
    private String currency;
    private UUID leadId;
    private UUID opportunityId;
    private UUID quotationId;
    private String quotationNumber;
    private String pdfUrl;
    private String notes;
}
