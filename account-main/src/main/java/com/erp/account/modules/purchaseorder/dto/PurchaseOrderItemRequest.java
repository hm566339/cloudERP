package com.erp.account.modules.purchaseorder.dto;

import com.erp.account.enums.ItemType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PurchaseOrderItemRequest {

    private UUID id;

    private UUID itemId;

    @NotBlank(message = "Item name is required")
    private String itemName;

    private String description;

    private UUID hsnSacId;

    private String unit;

    @Builder.Default
    private ItemType itemType = ItemType.PRODUCT;

    @NotNull(message = "Ordered quantity is required")
    @DecimalMin(value = "0.0001", message = "Ordered quantity must be greater than zero")
    private BigDecimal orderedQuantity;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.0", message = "Unit price cannot be negative")
    private BigDecimal unitPrice;

    private BigDecimal discountPercent;

    private BigDecimal cgstRate;

    private BigDecimal sgstRate;

    private BigDecimal igstRate;

    private BigDecimal cessRate;

    private UUID warehouseId;

    private UUID locationId;

    private String notes;
}
