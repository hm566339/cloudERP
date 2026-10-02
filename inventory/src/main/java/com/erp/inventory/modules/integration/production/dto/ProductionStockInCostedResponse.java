package com.erp.inventory.modules.integration.production.dto;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.util.UUID;

@Value
@Builder
public class ProductionStockInCostedResponse {
    UUID inventoryMovementId;
    String movementType;
    String referenceType;
    UUID referenceId;
    UUID referenceLineId;
    UUID companyId;
    BigDecimal quantity;
    UUID uomId;
    BigDecimal unitCost;
    BigDecimal totalCost;
    String status;
}