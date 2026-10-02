package com.erp.account.modules.report.dto.response;

import com.erp.account.modules.common.dto.BaseResponseDto;

import com.erp.account.common.dto.response.PaginationResponse;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;
import java.util.UUID;
import io.swagger.v3.oas.annotations.media.Schema;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@Schema(description = "Response containing the general ledger report details and transactions")
public class GeneralLedgerResponse extends BaseResponseDto  {
    @Schema(description = "Company UUID", example = "123e4567-e89b-12d3-a456-426614174000")
    private UUID companyId;

    @Schema(description = "Company name", example = "Acme Corp")
    private String companyName;

    @Schema(description = "Account UUID if generated for a specific account", example = "123e4567-e89b-12d3-a456-426614174001")
    private UUID accountId;

    @Schema(description = "Account code", example = "1001")
    private String accountCode;

    @Schema(description = "Account name", example = "Cash Account")
    private String accountName;

    @Schema(description = "Account type", example = "ASSET")
    private String accountType;

    @Schema(description = "Account category", example = "CURRENT_ASSETS")
    private String accountCategory;

    @Schema(description = "Start date of the ledger", example = "2026-01-01")
    private LocalDate fromDate;

    @Schema(description = "End date of the ledger", example = "2026-12-31")
    private LocalDate toDate;

    @Schema(description = "Base currency of the company", example = "USD")
    private String currency;

    @Schema(description = "Financial year", example = "2026-2027")
    private String financialYear;

    @Schema(description = "List of ledger transactions within the period")
    private List<LedgerTransactionResponse> transactions;

    @Schema(description = "Opening balance details")
    private BalanceDto openingBalance;

    @Schema(description = "Closing balance details")
    private BalanceDto closingBalance;

    @Schema(description = "Total debit during the period", example = "50000.00")
    private java.math.BigDecimal totalDebit;

    @Schema(description = "Total credit during the period", example = "20000.00")
    private java.math.BigDecimal totalCredit;

    @Schema(description = "Pagination metadata")
    private PaginationResponse pagination;

    @Schema(description = "Timestamp when the report was generated")
    private java.time.LocalDateTime generatedAt;
    
    @Schema(description = "Applied filters for the report")
    private AppliedFiltersResponse appliedFilters;
}
