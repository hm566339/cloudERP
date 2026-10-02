package com.erp.inventory.modules.valuation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCostLayerResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private UUID productId;
    private UUID warehouseId;
    private UUID batchId;
    private UUID sourceMovementId;
    private UUID sourceMovementLineId;
    private BigDecimal receivedQuantity;
    private BigDecimal remainingQuantity;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private BigDecimal consumedCost;
}
