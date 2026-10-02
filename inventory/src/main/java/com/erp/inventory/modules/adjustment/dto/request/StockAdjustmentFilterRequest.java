package com.erp.inventory.modules.adjustment.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class StockAdjustmentFilterRequest {
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
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
}
