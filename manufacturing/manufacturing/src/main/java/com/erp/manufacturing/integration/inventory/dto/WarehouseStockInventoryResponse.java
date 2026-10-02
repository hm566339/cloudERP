package com.erp.manufacturing.integration.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStockInventoryResponse {
    private UUID warehouseId;
    private String warehouseName;
    private BigDecimal totalQuantity;
    private BigDecimal availableQuantity;
    private List<LocationStockInventoryResponse> locations;
}
