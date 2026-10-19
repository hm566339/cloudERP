package com.erp.manufacturing.integration.inventory.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductInventoryInfo {
    private String productCode;
    private String sku;
    private String productName;
    private String productType;
    private String status;
    private String description;
}