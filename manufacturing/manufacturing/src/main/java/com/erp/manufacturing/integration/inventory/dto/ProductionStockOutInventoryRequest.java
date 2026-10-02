package com.erp.manufacturing.integration.inventory.dto;

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
public class ProductionStockOutInventoryRequest {
    private UUID productionOrderId;
    private UUID productionOrderMaterialId;
    private UUID productId;
    private BigDecimal quantity;
    private UUID uomId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private UUID serialId;
    private UUID reservationId;
    private String idempotencyKey;
}
