package com.erp.account.common.dto.inventory.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductResponse {
    private UUID id;
    private UUID companyId;
    private String productCode;
    private String sku;
    private String productName;
    private String productType;
    private String status;
    private String baseUomCode;
    private BigDecimal standardCost;
    private BigDecimal sellingPrice;
}
