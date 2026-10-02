package com.erp.account.modules.purchaseorder.dto;

import com.erp.account.enums.ItemType;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderItemResponse {

    private UUID id;
    private UUID companyId;
    private UUID purchaseOrderId;
    private UUID itemId;
    private String itemName;
    private String description;
    private UUID hsnSacId;
    private String hsnSacCode;
    private String unit;
    private ItemType itemType;
    private BigDecimal orderedQuantity;
    private BigDecimal receivedQuantity;
    private BigDecimal pendingQuantity;
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
    private UUID warehouseId;
    private String warehouseName;
    private UUID locationId;
    private String locationName;
    private String notes;
}
