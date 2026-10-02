package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Input Tax Credit (ITC) ledger summary for the GST Summary Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Input Tax Credit (ITC) position for the selected period")
public class ItcSummaryDto {

    @Schema(description = "ITC balance available at the start of the period", example = "45000.0000")
    @Builder.Default
    private BigDecimal openingITC = BigDecimal.ZERO;

    @Schema(description = "Total ITC available in the period (eligible inputs)", example = "118000.0000")
    @Builder.Default
    private BigDecimal availableITC = BigDecimal.ZERO;

    @Schema(description = "Eligible ITC which can be utilised", example = "118000.0000")
    @Builder.Default
    private BigDecimal eligibleITC = BigDecimal.ZERO;

    @Schema(description = "Blocked ITC not available for utilisation", example = "0.0000")
    @Builder.Default
    private BigDecimal blockedITC = BigDecimal.ZERO;

    @Schema(description = "ITC reversed in the period", example = "0.0000")
    @Builder.Default
    private BigDecimal reversedITC = BigDecimal.ZERO;

    @Schema(description = "ITC utilised against output liability", example = "118000.0000")
    @Builder.Default
    private BigDecimal utilizedITC = BigDecimal.ZERO;

    @Schema(description = "ITC balance carried forward to the next period", example = "45000.0000")
    @Builder.Default
    private BigDecimal closingITC = BigDecimal.ZERO;
}
