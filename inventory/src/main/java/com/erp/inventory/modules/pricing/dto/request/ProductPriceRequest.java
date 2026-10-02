package com.erp.inventory.modules.pricing.dto.request;

import lombok.Data;
import com.erp.inventory.modules.product.enums.PriceType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;

@Data
public class ProductPriceRequest {
    @NotNull(message = "productId is required")
    private UUID productId;
    @NotNull(message = "priceType is required")
    private PriceType priceType;
    @NotNull(message = "price is required")
    @Min(value = 0, message = "price cannot be negative")
    private BigDecimal price;
    @NotBlank(message = "currencyCode is required")
    @Size(max = 255, message = "currencyCode must not exceed 255 characters")
    private String currencyCode;
    @NotNull(message = "minQuantity is required")
    @Min(value = 0, message = "minQuantity cannot be negative")
    private BigDecimal minQuantity;
    private LocalDateTime effectiveFrom;
    private LocalDateTime effectiveTo;
    private String status;
}
