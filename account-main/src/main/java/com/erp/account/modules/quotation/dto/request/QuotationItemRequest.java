package com.erp.account.modules.quotation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * Request DTO for Quotation Line Item
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request model for Quotation Line Item")
public class QuotationItemRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "Existing quotation line ID. Used during update to preserve line identity.")
    private UUID id;

    @Schema(description = "Item master ID")
    private UUID itemId;

    @NotNull(message = "HSN/SAC code is mandatory for tax calculation")
    @Size(max = 15, message = "HSN/SAC code must not exceed 15 characters")
    @Schema(description = "HSN/SAC code for tax classification")
    private String hsnSacCode;

    @Size(max = 255, message = "Item name must not exceed 255 characters")
    @Schema(description = "Item or service name")
    private String itemName;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Quantity is mandatory")
    @DecimalMin(value = "0.0001", message = "Quantity must be greater than 0")
    @Digits(integer = 15, fraction = 4)
    private BigDecimal quantity;

    @Schema(description = "Unit of measure")
    private String unit;

    @NotNull(message = "Unit price is mandatory")
    @DecimalMin(value = "0.0000", message = "Unit price cannot be negative")
    @Digits(integer = 15, fraction = 4)
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.00", message = "Discount percent cannot be negative")
    @DecimalMax(value = "100.00", message = "Discount percent cannot exceed 100")
    @Digits(integer = 3, fraction = 2)
    private BigDecimal discountPercent;


    @Size(max = 1000, message = "Notes must not exceed 1000 characters")
    private String notes;
}
