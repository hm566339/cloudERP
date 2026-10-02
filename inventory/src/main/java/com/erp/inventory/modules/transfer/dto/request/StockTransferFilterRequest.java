package com.erp.inventory.modules.transfer.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class StockTransferFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private String transferNo;
    private LocalDateTime transferDate;
    private UUID sourceWarehouseId;
    private UUID destinationWarehouseId;
    private String status;
    private UUID stockMovementId;
    private String remarks;
    private UUID initiatedBy;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
    private LocalDateTime dispatchedAt;
    private LocalDateTime receivedAt;
}
