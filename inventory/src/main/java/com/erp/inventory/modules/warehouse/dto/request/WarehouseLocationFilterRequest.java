package com.erp.inventory.modules.warehouse.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class WarehouseLocationFilterRequest {
    private UUID companyId;
    private String searchKey;
    private LocalDateTime createdFrom;
    private LocalDateTime createdTo;
    private LocalDateTime updatedFrom;
    private LocalDateTime updatedTo;
    private List<UUID> ids;
    private UUID warehouseId;
    private UUID parentLocationId;
    private String locationCode;
    private String locationName;
    private Boolean isActive;
}
