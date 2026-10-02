package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Enhanced GST Summary Dashboard response.
 *
 * <p>The existing flat fields (taxableAmount, cgst, sgst, igst, cess, totalTax,
 * outputGst, inputGst, availableItc, utilizedItc, netGstLiability, reverseCharge,
 * zeroRatedSupply, nilRatedSupply, exemptSupply) are retained for backward
 * compatibility and mirror the new structured sections.</p>
 *
 * <pre>
 * data
 *  ├── summary
 *  ├── taxSummary
 *  ├── itcSummary
 *  ├── gstLiability
 *  ├── supplySummary
 *  ├── statistics
 *  ├── charts
 *  ├── exportOptions
 *  └── audit
 * </pre>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "GST Summary Dashboard response containing tax totals and structured dashboard sections")
public class GstSummaryDto {

    // ============================================================
    // LEGACY FLAT FIELDS (kept for backward compatibility)
    // ============================================================

    @Schema(description = "Total taxable value of outward supplies", example = "1250000.0000")
    @Builder.Default
    private BigDecimal taxableAmount = BigDecimal.ZERO;

    @Schema(description = "Total CGST on outward supplies", example = "62500.0000")
    @Builder.Default
    private BigDecimal cgst = BigDecimal.ZERO;

    @Schema(description = "Total SGST on outward supplies", example = "62500.0000")
    @Builder.Default
    private BigDecimal sgst = BigDecimal.ZERO;

    @Schema(description = "Total IGST on outward supplies", example = "87500.0000")
    @Builder.Default
    private BigDecimal igst = BigDecimal.ZERO;

    @Schema(description = "Total cess on outward supplies", example = "1250.0000")
    @Builder.Default
    private BigDecimal cess = BigDecimal.ZERO;

    @Schema(description = "Total tax on outward supplies", example = "213750.0000")
    @Builder.Default
    private BigDecimal totalTax = BigDecimal.ZERO;

    @Schema(description = "Total output GST on outward supplies", example = "213750.0000")
    @Builder.Default
    private BigDecimal outputGst = BigDecimal.ZERO;

    @Schema(description = "Total input GST on inward supplies", example = "118000.0000")
    @Builder.Default
    private BigDecimal inputGst = BigDecimal.ZERO;

    @Schema(description = "ITC available for utilisation", example = "118000.0000")
    @Builder.Default
    private BigDecimal availableItc = BigDecimal.ZERO;

    @Schema(description = "ITC utilised against output liability", example = "118000.0000")
    @Builder.Default
    private BigDecimal utilizedItc = BigDecimal.ZERO;

    @Schema(description = "Net GST liability after ITC set-off", example = "95750.0000")
    @Builder.Default
    private BigDecimal netGstLiability = BigDecimal.ZERO;

    @Schema(description = "GST payable under reverse charge", example = "0.0000")
    @Builder.Default
    private BigDecimal reverseCharge = BigDecimal.ZERO;

    @Schema(description = "Zero rated supply value (export and SEZ)", example = "150000.0000")
    @Builder.Default
    private BigDecimal zeroRatedSupply = BigDecimal.ZERO;

    @Schema(description = "Nil rated supply value", example = "25000.0000")
    @Builder.Default
    private BigDecimal nilRatedSupply = BigDecimal.ZERO;

    @Schema(description = "Exempt supply value", example = "10000.0000")
    @Builder.Default
    private BigDecimal exemptSupply = BigDecimal.ZERO;

    // ============================================================
    // ENTERPRISE DASHBOARD SECTIONS
    // ============================================================

    @Schema(description = "Report context metadata (header block)")
    @Builder.Default
    private ReportSummaryDto summary = new ReportSummaryDto();

    @Schema(description = "Outward GST tax summary")
    @Builder.Default
    private TaxSummaryDto taxSummary = new TaxSummaryDto();

    @Schema(description = "Input tax credit position")
    @Builder.Default
    private ItcSummaryDto itcSummary = new ItcSummaryDto();

    @Schema(description = "Net GST liability computation")
    @Builder.Default
    private GstLiabilityDto gstLiability = new GstLiabilityDto();

    @Schema(description = "Outward supply classification by supply type")
    @Builder.Default
    private SupplySummaryDto supplySummary = new SupplySummaryDto();

    @Schema(description = "Transaction volume statistics")
    @Builder.Default
    private StatisticsDto statistics = new StatisticsDto();

    @Schema(description = "Chart-ready datasets")
    @Builder.Default
    private ChartsDto charts = new ChartsDto();

    @Schema(description = "Export and print capabilities")
    @Builder.Default
    private ExportOptionsDto exportOptions = new ExportOptionsDto();

    @Schema(description = "Audit trail for the generated report")
    @Builder.Default
    private AuditDto audit = new AuditDto();
}
