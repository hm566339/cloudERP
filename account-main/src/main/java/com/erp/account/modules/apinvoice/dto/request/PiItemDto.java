package com.erp.account.modules.apinvoice.dto.request;

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
public class PiItemDto {
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
    private BigDecimal discountAmount;
    private BigDecimal taxableAmount;
    private BigDecimal cgst;
    private BigDecimal sgst;
    private BigDecimal igst;
    private BigDecimal cess;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private String expenseAccount;
    private String warehouse;
    private String batchNumber;
    private String serialNumber;
    private LocalDate expiryDate;
    private String costCenter;
    private PurchaseItemInventoryResponse inventory;
}

