package com.erp.inventory.modules.warehouse.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.erp.inventory.modules.warehouse.enums.LocationType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseLocationResponse {
    private UUID id;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private UUID createdBy;
    private UUID updatedBy;
    private Boolean isDeleted;
    private Long version;
    private UUID warehouseId;
    private UUID parentLocationId;
    private String locationCode;
    private String locationName;
    private LocationType locationType;
    private Boolean isActive;
}

