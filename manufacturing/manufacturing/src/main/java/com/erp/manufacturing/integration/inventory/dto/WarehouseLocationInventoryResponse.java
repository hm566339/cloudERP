package com.erp.manufacturing.integration.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseLocationInventoryResponse {
    private UUID id;
    private UUID companyId;
    private UUID warehouseId;
    private String locationCode;
    private String locationName;
    private Boolean isActive;
}