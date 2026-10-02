package com.erp.account.modules.goodsreceipt.dto;

import com.erp.account.enums.ItemType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptItemResponse {

    private UUID id;
    private UUID companyId;
    private UUID goodsReceiptId;
    private UUID purchaseOrderItemId;
    private UUID itemId;
    private String itemName;
    private String description;
    private String unit;
    private ItemType itemType;
    private BigDecimal orderedQuantity;
    private BigDecimal previouslyReceivedQuantity;
    private BigDecimal receivedQuantity;
    private BigDecimal acceptedQuantity;
    private BigDecimal rejectedQuantity;
    private String rejectionReason;
    private BigDecimal pendingQuantity;
    private BigDecimal unitPrice;
    private String batchNumber;
    private String serialNumber;
    private LocalDate expiryDate;
    private UUID warehouseId;
    private String warehouseName;
    private UUID locationId;
    private String locationName;
    private String notes;
}
