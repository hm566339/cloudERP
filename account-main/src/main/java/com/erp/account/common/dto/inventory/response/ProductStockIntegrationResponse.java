package com.erp.account.common.dto.inventory.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductStockIntegrationResponse extends BaseResponseDto  {
    private UUID productId;
    private String productName;
    private BigDecimal totalQuantity;
    private BigDecimal availableQuantity;
    private UUID hsnSacId;
    private String hsnSacCode;
    private String hsnSacName;
    private BigDecimal sellingPrice;
    private BigDecimal purchasePrice;
    private UUID baseUomId;
    private String baseUomCode;
    private String baseUomName;
    private List<WarehouseStockIntegrationResponse> warehouses;
}
