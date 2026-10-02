package com.erp.inventory.modules.integration.production.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class ProductionStockInCostedRequest {
    @NotNull private UUID productionOrderId;
    @NotNull private UUID productionOrderOutputId;
    @NotNull private UUID productId;
    @NotNull @DecimalMin("0.000001") private BigDecimal quantity;
    @NotNull private UUID uomId;
    @NotNull private UUID warehouseId;
    @NotNull private UUID locationId;
    private UUID batchId;
    private UUID serialId;
    @NotNull private BigDecimal productionCostPerUnit;
    @NotNull private BigDecimal productionTotalCost;
    private String currencyCode;
    @NotNull private UUID idempotencyKey;
}