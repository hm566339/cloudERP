package com.erp.inventory.modules.valuation.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class InventoryCostLayerRequest {
    @NotNull(message = "productId is required")
    private UUID productId;
    @NotNull(message = "warehouseId is required")
    private UUID warehouseId;
    @NotNull(message = "batchId is required")
    private UUID batchId;
    @NotNull(message = "sourceMovementId is required")
    private UUID sourceMovementId;
    @NotNull(message = "sourceMovementLineId is required")
    private UUID sourceMovementLineId;
    @NotNull(message = "receivedQuantity is required")
    @Min(value = 0, message = "receivedQuantity cannot be negative")
    private BigDecimal receivedQuantity;
    @NotNull(message = "remainingQuantity is required")
    @Min(value = 0, message = "remainingQuantity cannot be negative")
    private BigDecimal remainingQuantity;
    @NotNull(message = "unitCost is required")
    @Min(value = 0, message = "unitCost cannot be negative")
    private BigDecimal unitCost;
    @NotNull(message = "totalCost is required")
    @Min(value = 0, message = "totalCost cannot be negative")
    private BigDecimal totalCost;
    @NotNull(message = "consumedCost is required")
    @Min(value = 0, message = "consumedCost cannot be negative")
    private BigDecimal consumedCost;
}
