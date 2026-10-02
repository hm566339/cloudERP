package com.erp.inventory.modules.product.dto.request;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

@Data
public class UnitOfMeasureRequest {
    @NotBlank(message = "UOM name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @NotNull(message = "Decimal places is required")
    @Min(value = 0, message = "Decimal places cannot be negative")
    @Max(value = 6, message = "Decimal places cannot exceed 6")
    private Integer decimalPlaces;

    private Boolean isActive;
}
