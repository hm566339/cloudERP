package com.erp.inventory.modules.adjustment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private String adjustmentNo;
    private LocalDateTime adjustmentDate;
    private UUID warehouseId;
    private UUID locationId;
    private String reason;
    private String remarks;
    private String status;
    private UUID stockMovementId;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private List<StockAdjustmentLineResponse> lines;
}
