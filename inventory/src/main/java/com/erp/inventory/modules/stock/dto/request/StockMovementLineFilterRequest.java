package com.erp.inventory.modules.stock.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class StockMovementLineFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private UUID stockMovementId;
    private UUID productId;
    private UUID sourceWarehouseId;
    private UUID sourceLocationId;
    private UUID destinationWarehouseId;
    private UUID destinationLocationId;
    private UUID batchId;
    private UUID serialId;
    private UUID uomId;
    private BigDecimal quantity;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private BigDecimal quantityBefore;
    private BigDecimal quantityAfter;
    private UUID referenceLineId;
}
