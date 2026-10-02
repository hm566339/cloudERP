package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Outward tax aggregation for the GST Summary Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Outward GST tax summary (taxable value and tax component totals)")
public class TaxSummaryDto {

    @Schema(description = "Total taxable value of outward supplies", example = "1250000.0000")
    @Builder.Default
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Schema(description = "Total CGST collected on outward supplies", example = "62500.0000")
    @Builder.Default
    private BigDecimal cgst = BigDecimal.ZERO;

    @Schema(description = "Total SGST collected on outward supplies", example = "62500.0000")
    @Builder.Default
    private BigDecimal sgst = BigDecimal.ZERO;

    @Schema(description = "Total IGST collected on outward supplies", example = "87500.0000")
    @Builder.Default
    private BigDecimal igst = BigDecimal.ZERO;

    @Schema(description = "Total cess collected on outward supplies", example = "1250.0000")
    @Builder.Default
    private BigDecimal cess = BigDecimal.ZERO;

    @Schema(description = "Total GST + cess tax on outward supplies", example = "213750.0000")
    @Builder.Default
    private BigDecimal totalTax = BigDecimal.ZERO;

    @Schema(description = "Total tax collected (charged to customers) on outward supplies", example = "213750.0000")
    @Builder.Default
    private BigDecimal taxCollected = BigDecimal.ZERO;

    @Schema(description = "Total tax paid on inward supplies and reverse charge", example = "118000.0000")
    @Builder.Default
    private BigDecimal taxPaid = BigDecimal.ZERO;
}
