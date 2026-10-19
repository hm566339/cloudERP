package com.erp.manufacturing.integration.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseInventoryResponse {
    private UUID id;
    private UUID companyId;
    private String warehouseCode;
    private String warehouseName;
    private String status;
}