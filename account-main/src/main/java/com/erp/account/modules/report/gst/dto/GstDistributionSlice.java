package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Single slice of the GST distribution (pie/donut) chart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "GST distribution slice for pie/donut charts")
public class GstDistributionSlice {

    @Schema(description = "Tax component label", example = "CGST")
    private String name;

    @Schema(description = "Tax value for the component", example = "62500.0000")
    private BigDecimal value = BigDecimal.ZERO;
}
