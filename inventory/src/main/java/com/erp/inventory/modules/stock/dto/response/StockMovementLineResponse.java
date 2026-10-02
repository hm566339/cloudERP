package com.erp.inventory.modules.stock.dto.response;

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
public class StockMovementLineResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private UUID stockMovementId;
    private UUID productId;
    private UUID sourceWarehouseId;
    private UUID sourceLocationId;
    private UUID destinationWarehouseId;
    private UUID destinationLocationId;
    private UUID batchId;
    private UUID serialId;
    private UUID uomId;
    private UUID transactionUomId;
    private BigDecimal transactionQuantity;
    private BigDecimal conversionFactor;
    private BigDecimal transactionUnitCost;
    private BigDecimal quantity;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private BigDecimal quantityBefore;
    private BigDecimal quantityAfter;
    private UUID referenceLineId;
}
