package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Single state data point for the state-wise tax chart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "State-wise tax data point for bar/geo charts")
public class StateWiseTaxPoint {

    @Schema(description = "Place of supply / state code", example = "27")
    private String stateCode;

    @Schema(description = "State name when resolvable, otherwise the supplied code", example = "Maharashtra")
    private String stateName;

    @Schema(description = "Taxable value attributed to the state", example = "420000.0000")
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Schema(description = "Total tax attributed to the state", example = "71800.0000")
    private BigDecimal totalTax = BigDecimal.ZERO;
}
