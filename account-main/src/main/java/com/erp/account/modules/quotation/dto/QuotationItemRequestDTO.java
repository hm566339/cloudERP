package com.erp.account.modules.quotation.dto;

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
public class QuotationItemRequestDTO {

    private UUID hsnSacId;
    private UUID itemId;

    @NotBlank(message = "Item name is mandatory")
    private String itemName;

    private String description;

    @NotNull(message = "Quantity is mandatory")
    @DecimalMin(value = "0.0001", message = "Quantity must be greater than 0")
    private BigDecimal quantity;

    private String unit;

    @NotNull(message = "Unit price is mandatory")
    @DecimalMin(value = "0.0", message = "Unit price must be positive")
    private BigDecimal unitPrice;

    private BigDecimal discountPercent;

    // Tax rates
    private BigDecimal cgstRate;
    private BigDecimal sgstRate;
    private BigDecimal igstRate;
    private BigDecimal cessRate;

    private String notes;

}
