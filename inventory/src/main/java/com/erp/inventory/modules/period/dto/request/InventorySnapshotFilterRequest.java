package com.erp.inventory.modules.period.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class InventorySnapshotFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private String snapshotScope;
    private LocalDateTime snapshotDateFrom;
    private LocalDateTime snapshotDateTo;
    private UUID productId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
}
