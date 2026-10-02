package com.erp.account.modules.salesinvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiLineItemDto {
    private UUID itemId;
    private String itemCode;
    private String itemName;
    private String sku;
    private String description;
    private String hsnSacCode;
    private String gstSlab;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal unitPrice;
    private BigDecimal discountPercentage;
    private BigDecimal taxableAmount;
    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal cess;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    
    private SiItemInventoryDto inventory;
    
    private LocalDate expiryDate;
    private String costCenter;
    private String lineRemarks;
}

