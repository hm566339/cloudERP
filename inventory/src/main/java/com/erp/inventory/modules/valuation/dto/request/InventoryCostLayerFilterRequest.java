package com.erp.inventory.modules.valuation.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class InventoryCostLayerFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
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
