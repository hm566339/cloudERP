package com.erp.account.modules.reporting.dto.request;

import com.erp.account.enums.AccountNature;
import com.erp.account.modules.reporting.enums.GroupBy;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class TrialBalanceRequest {

    @Schema(description = "From date (yyyy-MM-dd). Opening balances are computed as of the day before this date.")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fromDate;

    @Schema(description = "To date (yyyy-MM-dd)")
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate toDate;

    @Schema(description = "Restrict to entries belonging to a fiscal year")
    private UUID fiscalYearId;

    @Schema(description = "Company id. Optional for system admins (queries across all companies).")
    private UUID companyId;

    @Schema(description = "Restrict to a single account")
    private UUID accountId;

    @Schema(description = "Restrict to a set of accounts")
    private List<UUID> accountIds;

    @Schema(description = "Exact account code prefix filter")
    private String accountCode;

    @Schema(description = "Free-text search over account name and account code (case-insensitive)")
    private String search;

    @Schema(description = "Restrict to account nature: DEBIT or CREDIT")
    private AccountNature accountType;

    @Schema(description = "Restrict to an account group")
    private UUID accountGroupId;

    @Schema(description = "Restrict to an account category (via account group)")
    private UUID categoryId;

    @Schema(description = "Restrict to accounts whose direct parent is this account")
    private UUID parentAccountId;

    @Schema(description = "Restrict to lines belonging to a branch")
    private UUID branchId;

    @Schema(description = "Restrict to lines belonging to a cost center")
    private UUID costCenterId;

    @Schema(description = "Restrict to lines belonging to a project")
    private UUID projectId;

    @Schema(description = "Restrict to lines belonging to a department")
    private UUID departmentId;

    @Schema(description = "Restrict to lines booked in a specific currency code (e.g. USD). "
            + "The system stores currency as a 3-letter code (currency_code) on journal lines and has no "
            + "separate currency master table, so this filter accepts the currency code rather than a currency id.")
    private String currencyCode;

    @Schema(description = "Only include POSTED entries. Defaults to true (matches ERP ledger behaviour).")
    private Boolean onlyPostedEntries;

    @Schema(description = "Include opening balance columns. Defaults to true (preserves legacy behaviour).")
    private Boolean includeOpeningBalance;

    @Schema(description = "Include accounts/groups with zero activity and zero balance. Defaults to true (preserves legacy behaviour).")
    private Boolean includeZeroBalance;

    @Schema(description = "Only include leaf accounts (no child accounts). Defaults to false.")
    private Boolean onlyLeafAccounts;

    @Schema(description = "Include inactive accounts. Defaults to true (preserves legacy behaviour of showing all accounts). "
            + "Set to false to restrict to active accounts only.")
    private Boolean includeInactiveAccounts;

    @Schema(description = "When accountId/accountIds are provided, expand the filter to include all descendant "
            + "(sub) accounts of the selected accounts. Defaults to false.")
    private Boolean includeSubAccounts;

    @Schema(description = "Grouping mode. Defaults to ACCOUNT (preserves legacy behaviour).")
    @Pattern(regexp = "ACCOUNT|ACCOUNT_GROUP|ACCOUNT_TYPE|PARENT_ACCOUNT|BRANCH|COST_CENTER|PROJECT",
            message = "groupBy must be one of ACCOUNT, ACCOUNT_GROUP, ACCOUNT_TYPE, PARENT_ACCOUNT, BRANCH, COST_CENTER, PROJECT")
    private String groupBy;

    @Schema(description = "Sort field. Whitelist: accountCode, accountName, periodDebit, periodCredit, transactionCount, lastTransactionDate. Defaults to accountCode.")
    private String sortBy;

    @Schema(description = "Sort direction: ASC or DESC. Defaults to ASC.")
    @Pattern(regexp = "ASC|DESC", message = "sortDirection must be ASC or DESC")
    private String sortDirection;

    @Min(value = 0, message = "page must be >= 0")
    private int page = 0;

    @Min(value = 1, message = "pageSize must be >= 1")
    @Max(value = 500, message = "pageSize must be <= 500")
    private int pageSize = 50;
}
