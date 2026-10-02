package com.erp.manufacturing.integration.inventory.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class ProductionOrderInventoryValidationRequest {
    private UUID companyId;
    private UUID finishedProductId;
    private UUID warehouseId;
    private UUID productionLocationId;
    private List<ProductionOrderMaterialInventoryReference> materials;
    private List<ProductionOrderOutputInventoryReference> outputs;
}
