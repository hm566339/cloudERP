package com.erp.account.modules.quotation.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QtLineItemDto {
    private java.util.UUID itemId;
    private String itemCode;
    private String itemName;
    private String sku;
    private String description;
    private String hsnSacCode;
    private String hsnSacDescription;
    private String gstSlab;
    private java.math.BigDecimal quantity;
    private String unit;
    private java.math.BigDecimal unitPrice;
    private java.math.BigDecimal discountPercentage;
    private java.math.BigDecimal discountAmount;
    private java.math.BigDecimal taxableAmount;
    private java.math.BigDecimal cgst;
    private java.math.BigDecimal sgst;
    private java.math.BigDecimal igst;
    private java.math.BigDecimal cess;
    private java.math.BigDecimal taxAmount;
    private java.math.BigDecimal totalAmount;
    private String lineRemarks;
}
