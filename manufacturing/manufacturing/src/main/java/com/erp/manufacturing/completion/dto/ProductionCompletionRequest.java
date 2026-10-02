package com.erp.manufacturing.completion.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class ProductionCompletionRequest {
    @NotNull private UUID productionOrderOutputId;
    @NotNull @DecimalMin(value = "0.000001") private BigDecimal quantity;
    @NotNull private UUID uomId;
    @NotNull private UUID warehouseId;
    @NotNull private UUID locationId;
    private UUID batchId;
    private UUID serialId;
    @NotBlank private String idempotencyKey;
}