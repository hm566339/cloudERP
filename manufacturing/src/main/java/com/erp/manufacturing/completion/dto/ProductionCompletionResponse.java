package com.erp.manufacturing.completion.dto;

import com.erp.manufacturing.common.enums.CompletionStatus;
import com.erp.manufacturing.common.enums.ProductionOrderStatus;
import com.erp.manufacturing.common.enums.ProductionOutputStatus;
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
public class ProductionCompletionResponse {
    private UUID productionCompletionId;
    private UUID productionOrderId;
    private UUID productionOrderOutputId;
    private BigDecimal quantity;
    private UUID uomId;
    private UUID inventoryMovementId;
    private CompletionStatus status;
    private ProductionOutputStatus outputStatus;
    private ProductionOrderStatus productionOrderStatus;
}