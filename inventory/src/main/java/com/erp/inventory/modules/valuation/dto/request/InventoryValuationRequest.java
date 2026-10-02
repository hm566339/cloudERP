package com.erp.inventory.modules.valuation.dto.request;

import lombok.Data;
import com.erp.inventory.modules.product.enums.ValuationMethod;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class InventoryValuationRequest {
    @NotNull(message = "stockMovementId is required")
    private UUID stockMovementId;
    @NotNull(message = "stockMovementLineId is required")
    private UUID stockMovementLineId;
    @NotNull(message = "productId is required")
    private UUID productId;
    @NotNull(message = "warehouseId is required")
    private UUID warehouseId;
    
    private UUID locationId;
    
    private UUID batchId;
    
    @NotNull(message = "valuationDate is required")
    private java.time.LocalDate valuationDate;
}
