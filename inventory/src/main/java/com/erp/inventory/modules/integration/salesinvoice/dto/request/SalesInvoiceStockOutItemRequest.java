package com.erp.inventory.modules.integration.salesinvoice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class SalesInvoiceStockOutItemRequest {

    @NotNull(message = "productId is required")
    private UUID productId;

    @NotNull(message = "quantity is required")
    @Min(value = 1, message = "quantity must be greater than zero")
    private BigDecimal quantity;

    @NotBlank(message = "unit is required")
    private String unit;

    @NotNull(message = "unitPrice is required")
    @Min(value = 0, message = "unitPrice must be zero or greater")
    private BigDecimal unitPrice;

    @NotNull(message = "warehouseId is required")
    private UUID warehouseId;

    private UUID locationId;

    private UUID batchId;

    private UUID serialId;
}
