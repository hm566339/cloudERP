package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Single month data point for the outward tax trend chart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Month-wise outward tax data point for line/bar charts")
public class MonthlyTaxTrendPoint {

    @Schema(description = "Month in YYYY-MM format", example = "2026-04")
    private String month;

    @Schema(description = "Taxable value for the month", example = "420000.0000")
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Schema(description = "CGST for the month", example = "21000.0000")
    private BigDecimal cgst = BigDecimal.ZERO;

    @Schema(description = "SGST for the month", example = "21000.0000")
    private BigDecimal sgst = BigDecimal.ZERO;

    @Schema(description = "IGST for the month", example = "29400.0000")
    private BigDecimal igst = BigDecimal.ZERO;

    @Schema(description = "Cess for the month", example = "400.0000")
    private BigDecimal cess = BigDecimal.ZERO;

    @Schema(description = "Total tax for the month", example = "71800.0000")
    private BigDecimal totalTax = BigDecimal.ZERO;
}
