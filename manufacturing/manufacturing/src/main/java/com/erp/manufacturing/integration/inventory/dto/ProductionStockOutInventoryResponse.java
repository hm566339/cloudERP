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
public class ProductionStockOutInventoryResponse {
    private UUID inventoryMovementId;
    private String movementType;
    private String referenceType;
    private UUID referenceId;
    private UUID referenceLineId;
    private UUID companyId;
    private BigDecimal quantity;
    private UUID uomId;
    private String status;
}
