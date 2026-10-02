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
public class WarehouseStockIntegrationResponse extends BaseResponseDto  {
    private UUID warehouseId;
    private String warehouseName;
    private BigDecimal totalQuantity;
    private BigDecimal availableQuantity;
    private List<LocationStockIntegrationResponse> locations;
}
