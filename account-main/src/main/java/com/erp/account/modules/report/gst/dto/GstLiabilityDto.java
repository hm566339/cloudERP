package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Net GST liability computation for the GST Summary Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Net GST liability computation for the selected period")
public class GstLiabilityDto {

    @Schema(description = "Total output GST (CGST + SGST + IGST + cess) on outward supplies", example = "213750.0000")
    @Builder.Default
    private BigDecimal outputGST = BigDecimal.ZERO;

    @Schema(description = "Total input GST available as credit", example = "118000.0000")
    @Builder.Default
    private BigDecimal inputGST = BigDecimal.ZERO;

    @Schema(description = "GST payable under reverse charge", example = "0.0000")
    @Builder.Default
    private BigDecimal reverseCharge = BigDecimal.ZERO;

    @Schema(description = "Interest on delayed payment", example = "0.0000")
    @Builder.Default
    private BigDecimal interest = BigDecimal.ZERO;

    @Schema(description = "Late fee for delayed filing", example = "0.0000")
    @Builder.Default
    private BigDecimal lateFee = BigDecimal.ZERO;

    @Schema(description = "Net GST payable after ITC set-off", example = "95750.0000")
    @Builder.Default
    private BigDecimal netGSTLiability = BigDecimal.ZERO;
}
