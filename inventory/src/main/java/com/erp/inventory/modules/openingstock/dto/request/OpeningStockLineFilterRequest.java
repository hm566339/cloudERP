package com.erp.inventory.modules.openingstock.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class OpeningStockLineFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private UUID openingStockId;
    private UUID productId;
    private UUID batchId;
    private UUID serialId;
    private BigDecimal quantity;
    private BigDecimal unitCost;
    private BigDecimal totalValue;
    private UUID uomId;
}
