package com.erp.manufacturing.integration.inventory.dto;

import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class BomInventoryValidationRequest {
    private UUID companyId;
    private UUID finishedProductId;
    private List<BomItemInventoryReference> items;
    private List<BomOutputInventoryReference> outputs;
}
