package com.erp.account.modules.goodsreceipt.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GoodsReceiptItemRequest {

    @NotNull(message = "Purchase Order Item ID is required")
    private UUID purchaseOrderItemId;

    @NotNull(message = "Received quantity is required")
    @DecimalMin(value = "0.0001", message = "Received quantity must be greater than zero")
    private BigDecimal receivedQuantity;

    private BigDecimal acceptedQuantity;

    private BigDecimal rejectedQuantity;

    private String rejectionReason;

    private String batchNumber;

    private String serialNumber;

    private LocalDate expiryDate;

    private UUID warehouseId;

    private UUID locationId;

    private String notes;
}
