package com.erp.account.modules.report.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Details of a single ledger transaction")
public class LedgerTransactionResponse extends BaseResponseDto  {
    @Schema(description = "Line item UUID", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    private UUID lineId;

    @Schema(description = "Journal entry UUID", example = "3fa85f64-5717-4562-b3fc-2c963f66afa7")
    private UUID journalEntryId;

    @Schema(description = "Voucher date", example = "2026-08-04")
    private LocalDate voucherDate;

    @Schema(description = "Type of voucher", example = "SALES_INVOICE")
    private SourceModule voucherType;

    @Schema(description = "Voucher number", example = "SI-2026-0001")
    private String voucherNumber;

    @Schema(description = "Reference number", example = "PO-9992")
    private String referenceNo;

    @Schema(description = "Account code, omitted if same as report level", example = "1001")
    private String accountCode;

    @Schema(description = "Account name, omitted if same as report level", example = "Cash Account")
    private String accountName;

    @Schema(description = "Line item description", example = "Payment received")
    private String description;

    @Schema(description = "Overall journal entry narration", example = "Payment received for invoice SI-2026-0001")
    private String narration;

    @Schema(description = "Debit amount", example = "5000.00")
    private BigDecimal debit;

    @Schema(description = "Credit amount", example = "0.00")
    private BigDecimal credit;

    @Schema(description = "Running balance after this transaction")
    private BalanceDto runningBalance;

    @Schema(description = "Currency code, omitted if same as report level", example = "USD")
    private String currency;

    @Schema(description = "Posting status", example = "POSTED")
    private PostingStatus status;

    @Schema(description = "UUID of the user who created this entry", example = "3fa85f64-5717-4562-b3fc-2c963f66afa8")
    private String createdBy;

    @Schema(description = "Timestamp when the entry was posted")
    private LocalDateTime postedAt;
    
    // Dimensions
    @Schema(description = "Branch code", example = "HQ")
    private String branchCode;

    @Schema(description = "Branch name", example = "Headquarters")
    private String branchName;

    @Schema(description = "Cost Center code", example = "MKT")
    private String costCenterCode;

    @Schema(description = "Cost Center name", example = "Marketing")
    private String costCenterName;

    @Schema(description = "Project code", example = "PRJ-01")
    private String projectCode;

    @Schema(description = "Project name", example = "Website Redesign")
    private String projectName;

}
