package com.erp.manufacturing.integration.inventory.dto;

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
public class MaterialAvailabilityResponse {
    private UUID materialId;
    private UUID productId;
    private BigDecimal requiredQuantity;
    private UUID uomId;
    private BigDecimal availableQuantity;
    private BigDecimal alreadyReservedQuantity;
    private BigDecimal remainingRequiredQuantity;
    private String availabilityStatus;
}
