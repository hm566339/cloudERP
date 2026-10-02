package com.erp.inventory.modules.integration.deliverychallan.dto.request;

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
public class DeliveryChallanStockOutItemRequest {

    @NotNull(message = "productId is required")
    private UUID productId;

    @NotNull(message = "quantity is required")
    @DecimalMin(value = "0.0001", message = "quantity must be greater than zero")
    private BigDecimal quantity;

    @NotBlank(message = "unit is required")
    private String unit;

    @NotNull(message = "unitPrice is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "unitPrice must be zero or greater")
    private BigDecimal unitPrice;

    @NotNull(message = "warehouseId is required")
    private UUID warehouseId;

    private UUID locationId;

    private UUID batchId;

    private UUID serialId;
}
