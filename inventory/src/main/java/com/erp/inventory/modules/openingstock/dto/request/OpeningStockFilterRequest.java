package com.erp.inventory.modules.openingstock.dto.request;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class OpeningStockFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private String openingStockNo;
    private LocalDate openingDate;
    private UUID warehouseId;
    private String status;
    private UUID stockMovementId;
    private String remarks;
    private UUID approvedBy;
    private LocalDateTime approvedAt;
}
