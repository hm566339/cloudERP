package com.erp.account.modules.invoicetax.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Request model for invoice tax details")
public class InvoiceTaxRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @NotNull(message = "GST slab ID is mandatory")
    @Schema(description = "GST slab ID used for tax calculation", requiredMode = Schema.RequiredMode.REQUIRED)
    private UUID gstSlabId;

    @NotNull(message = "Taxable amount is mandatory")
    @DecimalMin(value = "0.0000", inclusive = true, message = "Taxable amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "Taxable amount precision: 15 integer digits, 4 decimal places")
    @Schema(description = "Taxable amount for the invoice tax line", requiredMode = Schema.RequiredMode.REQUIRED)
    private BigDecimal taxableAmount;

    @DecimalMin(value = "0.0000", inclusive = true, message = "CGST amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "CGST amount precision: 15 integer digits, 4 decimal places")
    @Schema(description = "CGST amount for the tax line")
    private BigDecimal cgstAmount;

    @DecimalMin(value = "0.0000", inclusive = true, message = "SGST amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "SGST amount precision: 15 integer digits, 4 decimal places")
    @Schema(description = "SGST amount for the tax line")
    private BigDecimal sgstAmount;

    @DecimalMin(value = "0.0000", inclusive = true, message = "IGST amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "IGST amount precision: 15 integer digits, 4 decimal places")
    @Schema(description = "IGST amount for the tax line")
    private BigDecimal igstAmount;

    @DecimalMin(value = "0.0000", inclusive = true, message = "CESS amount cannot be negative")
    @Digits(integer = 15, fraction = 4, message = "CESS amount precision: 15 integer digits, 4 decimal places")
    @Schema(description = "CESS amount for the tax line")
    private BigDecimal cessAmount;
}
