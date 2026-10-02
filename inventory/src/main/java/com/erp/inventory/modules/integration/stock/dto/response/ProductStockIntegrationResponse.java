package com.erp.inventory.modules.integration.stock.dto.response;

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
public class ProductStockIntegrationResponse {
    private UUID productId;
    private String productName;
    private BigDecimal totalQuantity;
    private BigDecimal availableQuantity;
    private UUID hsnSacId;
    private String hsnSacCode;
    private String hsnSacName;
    private BigDecimal sellingPrice;
    private BigDecimal purchasePrice;
    private List<WarehouseStockIntegrationResponse> warehouses;
}
