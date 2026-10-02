package com.erp.account.modules.proformainvoice.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DirectPIItemRequest {

    private UUID itemId;

    @NotBlank(message = "Item name is required")
    private String itemName;

    private String description;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be greater than zero")
    private BigDecimal quantity;

    private String unit;

    @NotNull(message = "Unit price is required")
    private BigDecimal unitPrice;

    private BigDecimal discountPercent;

    @NotBlank(message = "HSN/SAC Code is required")
    private String hsnSacCode;



    private String notes;
}
