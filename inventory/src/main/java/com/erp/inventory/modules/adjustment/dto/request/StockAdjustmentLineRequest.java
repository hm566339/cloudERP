package com.erp.inventory.modules.adjustment.dto.request;

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
public class StockAdjustmentLineRequest {
    @NotNull(message = "stockAdjustmentId is required")
    private UUID stockAdjustmentId;
    @NotNull(message = "productId is required")
    private UUID productId;
    @NotNull(message = "batchId is required")
    private UUID batchId;
    @NotNull(message = "serialId is required")
    private UUID serialId;
    @NotBlank(message = "adjustmentType is required")
    private String adjustmentType; // INCREASE or DECREASE
    @NotNull(message = "quantity is required")
    @Min(value = 0, message = "quantity cannot be negative")
    private BigDecimal quantity;
    @NotNull(message = "unitCost is required")
    @Min(value = 0, message = "unitCost cannot be negative")
    private BigDecimal unitCost;
    @NotNull(message = "adjustmentValue is required")
    private BigDecimal adjustmentValue;
}
