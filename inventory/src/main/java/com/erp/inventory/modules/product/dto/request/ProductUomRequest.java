package com.erp.inventory.modules.product.dto.request;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class ProductUomRequest {
    @NotNull(message = "Product ID is required")
    private UUID productId;

    @NotNull(message = "UOM ID is required")
    private UUID uomId;

    @NotNull(message = "Conversion factor is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Conversion factor must be greater than zero")
    private BigDecimal conversionFactor;

    private Boolean isPurchaseUom;
    private Boolean isSalesUom;
    private Boolean isStockUom;
}
