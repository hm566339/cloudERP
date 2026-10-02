package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Supply classification summary (GST supply types) for the GST Summary Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Outward supply classification by GST supply type")
public class SupplySummaryDto {

    @Schema(description = "Total taxable value of all outward supplies", example = "1250000.0000")
    @Builder.Default
    private BigDecimal taxableSupply = BigDecimal.ZERO;

    @Schema(description = "Zero rated supply value (export and SEZ)", example = "150000.0000")
    @Builder.Default
    private BigDecimal zeroRatedSupply = BigDecimal.ZERO;

    @Schema(description = "Nil rated supply value (0% GST slab)", example = "25000.0000")
    @Builder.Default
    private BigDecimal nilRatedSupply = BigDecimal.ZERO;

    @Schema(description = "Exempt supply value (no GST slab applicable)", example = "10000.0000")
    @Builder.Default
    private BigDecimal exemptSupply = BigDecimal.ZERO;

    @Schema(description = "Export supply value (supplies to foreign customers)", example = "150000.0000")
    @Builder.Default
    private BigDecimal exportSupply = BigDecimal.ZERO;

    @Schema(description = "Import supply value", example = "0.0000")
    @Builder.Default
    private BigDecimal importSupply = BigDecimal.ZERO;

    @Schema(description = "SEZ supply value", example = "0.0000")
    @Builder.Default
    private BigDecimal sezSupply = BigDecimal.ZERO;

    @Schema(description = "Inter-state supply value (IGST charged)", example = "600000.0000")
    @Builder.Default
    private BigDecimal interstateSupply = BigDecimal.ZERO;

    @Schema(description = "Intra-state supply value (CGST + SGST charged)", example = "400000.0000")
    @Builder.Default
    private BigDecimal intrastateSupply = BigDecimal.ZERO;
}
