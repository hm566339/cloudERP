package com.erp.inventory.modules.product.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * CurrentStock
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentStock {

    private BigDecimal quantity;
    private BigDecimal reservedQuantity;
    private BigDecimal availableQuantity;
    private BigDecimal averageCost;
    private BigDecimal stockValue;

}
