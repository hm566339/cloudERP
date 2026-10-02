package com.erp.inventory.modules.stock.dto.request;

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
public class StockMovementLineRequest {
    @NotNull(message = "stockMovementId is required")
    private UUID stockMovementId;
    @NotNull(message = "productId is required")
    private UUID productId;
    @NotNull(message = "sourceWarehouseId is required")
    private UUID sourceWarehouseId;
    @NotNull(message = "sourceLocationId is required")
    private UUID sourceLocationId;
    @NotNull(message = "destinationWarehouseId is required")
    private UUID destinationWarehouseId;
    @NotNull(message = "destinationLocationId is required")
    private UUID destinationLocationId;
    @NotNull(message = "batchId is required")
    private UUID batchId;
    @NotNull(message = "serialId is required")
    private UUID serialId;
    @NotNull(message = "uomId is required")
    private UUID uomId;
    @NotNull(message = "quantity is required")
    @Min(value = 0, message = "quantity cannot be negative")
    private BigDecimal quantity;
    @NotNull(message = "unitCost is required")
    @Min(value = 0, message = "unitCost cannot be negative")
    private BigDecimal unitCost;
    @NotNull(message = "totalCost is required")
    @Min(value = 0, message = "totalCost cannot be negative")
    private BigDecimal totalCost;
    @NotNull(message = "quantityBefore is required")
    @Min(value = 0, message = "quantityBefore cannot be negative")
    private BigDecimal quantityBefore;
    @NotNull(message = "quantityAfter is required")
    @Min(value = 0, message = "quantityAfter cannot be negative")
    private BigDecimal quantityAfter;
    @NotNull(message = "referenceLineId is required")
    private UUID referenceLineId;
}
