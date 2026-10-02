package com.erp.inventory.modules.warehouse.dto.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Builder;
import lombok.Data;

import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * WarehouseAccountResponse
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseAccountResponse {

    private UUID warehouseId;
    private UUID warehouseLocation;
    private String warehouseName;
    private String warehouseLocationName;
    private UUID companyId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long version;

}
