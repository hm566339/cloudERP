package com.erp.account.modules.report.gst.dto;

import com.erp.account.modules.common.dto.BaseResponseDto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Aggregated totals for the GSTR-1 report")
public class Gstr1SummaryResponse extends BaseResponseDto  {

    @Schema(description = "Total number of invoices matching the filter", example = "124")
    private long totalInvoices;

    @Schema(description = "Sum of taxable amounts", example = "1250000.00")
    @Builder.Default
    private BigDecimal totalTaxableAmount = BigDecimal.ZERO;

    @Schema(description = "Sum of CGST", example = "62500.00")
    @Builder.Default
    private BigDecimal totalCgst = BigDecimal.ZERO;

    @Schema(description = "Sum of SGST", example = "62500.00")
    @Builder.Default
    private BigDecimal totalSgst = BigDecimal.ZERO;

    @Schema(description = "Sum of IGST", example = "87500.00")
    @Builder.Default
    private BigDecimal totalIgst = BigDecimal.ZERO;

    @Schema(description = "Sum of Cess", example = "2500.00")
    @Builder.Default
    private BigDecimal totalCess = BigDecimal.ZERO;

    @Schema(description = "Sum of total invoice values", example = "1465000.00")
    @Builder.Default
    private BigDecimal totalInvoiceValue = BigDecimal.ZERO;
}
