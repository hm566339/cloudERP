package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Single HSN data point for the HSN-wise tax chart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "HSN-wise tax data point for bar charts")
public class HsnWiseTaxPoint {

    @Schema(description = "HSN/SAC code", example = "847130")
    private String hsnCode;

    @Schema(description = "Description of the HSN code when available", example = "Portable automatic data processing machines")
    private String description;

    @Schema(description = "Taxable value for the HSN code", example = "320000.0000")
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Schema(description = "Total tax for the HSN code", example = "57600.0000")
    private BigDecimal totalTax = BigDecimal.ZERO;
}
