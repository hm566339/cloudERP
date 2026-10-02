package com.erp.manufacturing.integration.inventory.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class BomOutputInventoryReference {
    private UUID productId;
    private UUID uomId;
}
