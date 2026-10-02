package com.erp.account.modules.report.gst.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Transaction volume statistics for the GST Summary Dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Transaction volume statistics for the selected period")
public class StatisticsDto {

    @Schema(description = "Number of posted sales invoices in the period", example = "124")
    @Builder.Default
    private long salesInvoiceCount = 0L;

    @Schema(description = "Number of purchase invoices in the period", example = "86")
    @Builder.Default
    private long purchaseInvoiceCount = 0L;

    @Schema(description = "Number of credit notes raised in the period", example = "7")
    @Builder.Default
    private long creditNoteCount = 0L;

    @Schema(description = "Number of debit notes raised in the period", example = "3")
    @Builder.Default
    private long debitNoteCount = 0L;

    @Schema(description = "Distinct customers transacted with in the period", example = "42")
    @Builder.Default
    private long customerCount = 0L;

    @Schema(description = "Distinct vendors transacted with in the period", example = "28")
    @Builder.Default
    private long vendorCount = 0L;

    @Schema(description = "Total number of transactions (invoices + notes) in the period", example = "220")
    @Builder.Default
    private long totalTransactions = 0L;
}
