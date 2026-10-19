package com.erp.manufacturing.integration.inventory.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProductionStockOutCostInventoryResponse {
    private UUID companyId;
    private UUID inventoryMovementId;
    private UUID movementLineId;
    private UUID productionOrderId;
    private UUID productionOrderMaterialId;
    private UUID productId;
    private BigDecimal quantity;
    private UUID uomId;
    private UUID warehouseId;
    private UUID locationId;
    private UUID batchId;
    private UUID serialId;
    private BigDecimal unitCost;
    private BigDecimal totalCost;
    private String valuationMethod;
    private String referenceType;
    private String currencyCode;
    private String currency;

    public String getEffectiveCurrency() {
        if (currencyCode != null && !currencyCode.isBlank()) {
            return currencyCode.trim().toUpperCase();
        }
        if (currency != null && !currency.isBlank()) {
            return currency.trim().toUpperCase();
        }
        return null;
    }
}