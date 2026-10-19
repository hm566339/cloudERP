package com.erp.manufacturing.integration.inventory.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class BomItemInventoryReference {
    private UUID productId;
    private UUID uomId;
}
