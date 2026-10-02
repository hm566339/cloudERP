package com.erp.manufacturing.integration.inventory.dto;

import lombok.Data;
import lombok.Builder;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ProductionStockOutCostInventoryResponse {
    private UUID companyId;
    private UUID inventoryMovementId;
    private UUID movementLineId;
    private UUID productionOrderId;
    private UUID productionOrderMaterialId;
    private UUID productId;
    private BigDecimal quantity;
    private UUID uomId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private UUID serialId;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String valuationMethod;
    private String referenceType;
}