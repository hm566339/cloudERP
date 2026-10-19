package com.erp.manufacturing.integration.inventory.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ProductionStockInCostedInventoryRequest {
    private UUID productionOrderId;
    private UUID productionOrderOutputId;
    private UUID productId;
    private BigDecimal quantity;
    private UUID uomId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private UUID serialId;
    private BigDecimal productionCostPerUnit;
    private BigDecimal productionTotalCost;
    private String currencyCode;
    private UUID idempotencyKey;
}