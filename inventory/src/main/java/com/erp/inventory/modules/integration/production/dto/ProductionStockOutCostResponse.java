package com.erp.inventory.modules.integration.production.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.UUID;

@Value
@Builder
public class ProductionStockOutCostResponse {
    UUID companyId;
    UUID inventoryMovementId;
    UUID movementLineId;
    UUID productionOrderId;
    UUID productionOrderMaterialId;
    UUID productId;
    BigDecimal quantity;
    UUID uomId;
    UUID warehouseId;
    UUID locationId;
    UUID batchId;
    UUID serialId;
    BigDecimal unitCost;
    BigDecimal totalCost;
    String valuationMethod;
    String referenceType;
}