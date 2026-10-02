package com.erp.inventory.modules.adjustment.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class StockAdjustmentLineFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private UUID stockAdjustmentId;
    private UUID productId;
    private UUID batchId;
    private UUID serialId;
    private BigDecimal systemQuantity;
    private BigDecimal physicalQuantity;
    private BigDecimal differenceQuantity;
    private BigDecimal unitCost;
    private BigDecimal adjustmentValue;
}
