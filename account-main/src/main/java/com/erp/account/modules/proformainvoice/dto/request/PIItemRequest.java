package com.erp.account.modules.proformainvoice.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class PIItemRequest {
    @NotNull(message = "Item ID is required")
    private UUID itemId;

    @NotBlank(message = "Item name is required")
    private String itemName;

    private String description;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0001", message = "Quantity must be greater than zero")
    private BigDecimal quantity;

    private String unit;

    @NotNull(message = "Unit price is required")
    @DecimalMin(value = "0.00", message = "Unit price must be non-negative")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.00", message = "Discount percent must be non-negative")
    private BigDecimal discountPercent;

    @NotBlank(message = "HSN/SAC code is required")
    private String hsnSacCode;


    
    private String notes;
}
