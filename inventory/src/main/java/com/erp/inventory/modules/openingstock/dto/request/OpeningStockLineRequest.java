package com.erp.inventory.modules.openingstock.dto.request;

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
public class OpeningStockLineRequest {
    @NotNull(message = "warehouseLocationId is required")
    private UUID warehouseLocationId;
    @NotNull(message = "productId is required")
    private UUID productId;
    private UUID batchId;
    private UUID serialId;
    @NotNull(message = "quantity is required")
    @Min(value = 0, message = "quantity cannot be negative")
    private BigDecimal quantity;
    @NotNull(message = "unitCost is required")
    @Min(value = 0, message = "unitCost cannot be negative")
    private BigDecimal unitCost;
    @NotNull(message = "totalValue is required")
    private BigDecimal totalValue;
    @NotNull(message = "uomId is required")
    private UUID uomId;
}
