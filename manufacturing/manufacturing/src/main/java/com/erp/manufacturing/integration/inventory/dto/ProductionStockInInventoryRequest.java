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
public class ProductionStockInInventoryRequest {
    private UUID productionOrderId;
    private UUID productionOrderOutputId;
    private UUID productId;
    private BigDecimal quantity;
    private UUID uomId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private UUID serialId;
    private UUID idempotencyKey;
}