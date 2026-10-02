package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Single month data point for the input tax credit trend chart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Month-wise input tax credit data point for line/bar charts")
public class MonthlyItcTrendPoint {

    @Schema(description = "Month in YYYY-MM format", example = "2026-04")
    private String month;

    @Schema(description = "Input GST booked for the month", example = "36000.0000")
    private BigDecimal inputTax = BigDecimal.ZERO;

    @Schema(description = "ITC available for the month", example = "36000.0000")
    private BigDecimal availableItc = BigDecimal.ZERO;

    @Schema(description = "ITC utilised for the month", example = "36000.0000")
    private BigDecimal utilizedItc = BigDecimal.ZERO;

    @Schema(description = "ITC balance carried forward at month end", example = "45000.0000")
    private BigDecimal closingItc = BigDecimal.ZERO;
}
