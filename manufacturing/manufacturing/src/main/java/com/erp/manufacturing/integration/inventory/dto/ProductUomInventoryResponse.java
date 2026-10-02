package com.erp.manufacturing.integration.inventory.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ProductUomInventoryResponse {
    private UUID id;
    private UUID companyId;
    private UUID productId;
    private UUID uomId;
    private Boolean isDeleted;
}
