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
public class InventoryStockRequest {
    @NotNull(message = "productId is required")
    private UUID productId;
    @NotNull(message = "warehouseId is required")
    private UUID warehouseId;
    @NotNull(message = "locationId is required")
    private UUID locationId;
    @NotNull(message = "batchId is required")
    private UUID batchId;
    @NotNull(message = "quantity is required")
    @Min(value = 0, message = "quantity cannot be negative")
    private BigDecimal quantity;
    @NotNull(message = "reservedQuantity is required")
    @Min(value = 0, message = "reservedQuantity cannot be negative")
    private BigDecimal reservedQuantity;
    @NotNull(message = "availableQuantity is required")
    @Min(value = 0, message = "availableQuantity cannot be negative")
    private BigDecimal availableQuantity;
    @NotNull(message = "averageCost is required")
    @Min(value = 0, message = "averageCost cannot be negative")
    private BigDecimal averageCost;
    @NotNull(message = "stockValue is required")
    @Min(value = 0, message = "stockValue cannot be negative")
    private BigDecimal stockValue;
    private LocalDateTime lastMovementAt;
}
