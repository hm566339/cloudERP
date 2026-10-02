package com.erp.account.modules.purchaserequisition.dto;

import com.erp.account.enums.ItemType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PurchaseRequisitionItemRequest {
    private UUID itemId;
    @NotBlank private String itemName;
    private String description;
    private ItemType itemType;
    @NotNull @DecimalMin(value = "0.0001") private BigDecimal requestedQuantity;
    private String unit;
    @DecimalMin(value = "0.0") private BigDecimal estimatedUnitPrice;
    private LocalDate requiredDate;
    private UUID warehouseId;
    private UUID locationId;
    private String remarks;
}
