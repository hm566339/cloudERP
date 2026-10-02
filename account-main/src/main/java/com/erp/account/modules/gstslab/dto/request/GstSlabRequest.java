package com.erp.account.modules.gstslab.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GstSlabRequest implements Serializable {

    @NotBlank(message = "Slab name is required")
    private String slabName;

    @NotNull(message = "CGST rate is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "CGST rate cannot be negative")
    @DecimalMax(value = "100.00", inclusive = true, message = "CGST rate cannot exceed 100")
    @Digits(integer = 3, fraction = 2, message = "CGST rate precision must be up to 2 decimal places")
    private BigDecimal cgstRate;

    @NotNull(message = "SGST rate is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "SGST rate cannot be negative")
    @DecimalMax(value = "100.00", inclusive = true, message = "SGST rate cannot exceed 100")
    @Digits(integer = 3, fraction = 2, message = "SGST rate precision must be up to 2 decimal places")
    private BigDecimal sgstRate;

    @NotNull(message = "IGST rate is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "IGST rate cannot be negative")
    @DecimalMax(value = "100.00", inclusive = true, message = "IGST rate cannot exceed 100")
    @Digits(integer = 3, fraction = 2, message = "IGST rate precision must be up to 2 decimal places")
    private BigDecimal igstRate;

    @NotNull(message = "CESS rate is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "CESS rate cannot be negative")
    @DecimalMax(value = "100.00", inclusive = true, message = "CESS rate cannot exceed 100")
    @Digits(integer = 3, fraction = 2, message = "CESS rate precision must be up to 2 decimal places")
    private BigDecimal cessRate;

    @NotNull(message = "Effective from date is required")
    private LocalDate effectiveFrom;
}
