package com.erp.inventory.modules.integration.production.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductionStockOutRequest {
    @NotNull private UUID productionOrderId;
    @NotNull private UUID productionOrderMaterialId;
    @NotNull private UUID productId;
    @NotNull @DecimalMin(value = "0.000001") private BigDecimal quantity;
    @NotNull private UUID uomId;
    @NotNull private UUID warehouseId;
    @NotNull private UUID locationId;
    private UUID batchId;
    private UUID serialId;
    @NotNull private UUID reservationId;
    @NotNull private UUID idempotencyKey;
}
