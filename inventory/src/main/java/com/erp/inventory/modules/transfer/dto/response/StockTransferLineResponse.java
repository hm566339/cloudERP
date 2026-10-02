package com.erp.inventory.modules.transfer.dto.response;

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
public class StockTransferLineResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private UUID stockTransferId;
    private UUID productId;
    private UUID batchId;
    private UUID serialId;
    private UUID uomId;
    private BigDecimal quantity;
    private BigDecimal unitCost;
    private UUID sourceLocationId;
    private UUID destinationLocationId;
}
