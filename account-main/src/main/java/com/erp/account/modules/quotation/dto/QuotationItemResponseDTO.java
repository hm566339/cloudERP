package com.erp.account.modules.quotation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuotationItemResponseDTO {

    private UUID id;
    private UUID companyId;
    private UUID hsnSacId;
    private UUID itemId;
    private String itemName;
    private String description;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal unitPrice;
    
    private BigDecimal discountPercent;
    private BigDecimal discountAmount;
    private BigDecimal taxableAmount;
    
    private BigDecimal cgstRate;
    private BigDecimal cgstAmount;
    private BigDecimal sgstRate;
    private BigDecimal sgstAmount;
    private BigDecimal igstRate;
    private BigDecimal igstAmount;
    private BigDecimal cessRate;
    private BigDecimal cessAmount;
    
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    
    private String notes;
}
