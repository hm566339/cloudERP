package com.erp.manufacturing.integration.inventory.dto;

import lombok.Data;
import lombok.Builder;
import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ProductionStockInCostedInventoryResponse {
    private UUID inventoryMovementId;
    private String movementType;
    private String referenceType;
    private UUID referenceId;
    private UUID referenceLineId;
    private UUID companyId;
    private BigDecimal quantity;
    private UUID uomId;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String status;
}