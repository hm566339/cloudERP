package com.erp.inventory.modules.adjustment.dto.response;

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
public class StockAdjustmentLineResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private UUID stockAdjustmentId;
    private UUID productId;
    private UUID batchId;
    private UUID serialId;
    private String adjustmentType;
    private BigDecimal quantity;
    private BigDecimal unitCost;
    private BigDecimal adjustmentValue;
}
