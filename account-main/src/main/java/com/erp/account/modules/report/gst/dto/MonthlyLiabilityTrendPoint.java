package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Single month data point for the net GST liability trend chart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Month-wise net GST liability data point for line/bar charts")
public class MonthlyLiabilityTrendPoint {

    @Schema(description = "Month in YYYY-MM format", example = "2026-04")
    private String month;

    @Schema(description = "Output GST for the month", example = "71800.0000")
    private BigDecimal outputGst = BigDecimal.ZERO;

    @Schema(description = "Input GST for the month", example = "36000.0000")
    private BigDecimal inputGst = BigDecimal.ZERO;

    @Schema(description = "Net GST liability after ITC set-off for the month", example = "35800.0000")
    private BigDecimal netGstLiability = BigDecimal.ZERO;
}
