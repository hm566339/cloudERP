package com.erp.manufacturing.integration.inventory.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ProductionOrderOutputInventoryReference {
    private UUID productId;
    private UUID uomId;
    private UUID warehouseId;
    private UUID locationId;
}
