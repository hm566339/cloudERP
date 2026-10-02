package com.erp.account.modules.reporting.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.enums.AccountNature;
import com.erp.account.modules.report.dto.response.TrialBalanceResponse;
import com.erp.account.modules.reporting.dto.request.TrialBalanceRequest;
import com.erp.account.modules.reporting.service.TrialBalanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/v1/reports")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Trial Balance", description = "Trial Balance report endpoints")
public class TrialBalanceController {

    private final TrialBalanceService trialBalanceService;

    @Operation(summary = "Generate Trial Balance report",
            description = "Returns opening/period/closing balances per account (or per selected grouping) "
                    + "with full filtering, sorting and pagination. Grouping and sorting values are validated "
                    + "server side; unknown values are rejected.")
    @GetMapping(value = "/trial-balance", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<TrialBalanceResponse> trialBalance(
            @Parameter(description = "From date (yyyy-MM-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @Parameter(description = "To date (yyyy-MM-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @Parameter(description = "Restrict to a fiscal year") @RequestParam(required = false) UUID fiscalYearId,
            @Parameter(description = "Company id") @RequestParam(required = false) UUID companyId,
            @Parameter(description = "Restrict to a single account") @RequestParam(required = false) UUID accountId,
            @Parameter(description = "Restrict to a set of accounts (repeatable)") @RequestParam(required = false) List<UUID> accountIds,
            @Parameter(description = "Account code prefix filter") @RequestParam(required = false) String accountCode,
            @Parameter(description = "Free-text search over account name/code") @RequestParam(required = false) String search,
            @Parameter(description = "Account nature: DEBIT or CREDIT") @RequestParam(required = false) AccountNature accountType,
            @Parameter(description = "Restrict to an account group") @RequestParam(required = false) UUID accountGroupId,
            @Parameter(description = "Restrict to an account category") @RequestParam(required = false) UUID categoryId,
            @Parameter(description = "Restrict to a parent account") @RequestParam(required = false) UUID parentAccountId,
            @Parameter(description = "Restrict to a branch") @RequestParam(required = false) UUID branchId,
            @Parameter(description = "Restrict to a cost center") @RequestParam(required = false) UUID costCenterId,
            @Parameter(description = "Restrict to a project") @RequestParam(required = false) UUID projectId,
            @Parameter(description = "Restrict to a department") @RequestParam(required = false) UUID departmentId,
            @Parameter(description = "Restrict to a currency code (e.g. USD)") @RequestParam(required = false) String currencyCode,
            @Parameter(description = "Only include POSTED entries (default true)") @RequestParam(required = false) Boolean onlyPostedEntries,
            @Parameter(description = "Include opening balance columns (default true)") @RequestParam(required = false) Boolean includeOpeningBalance,
            @Parameter(description = "Include zero-balance rows (default true)") @RequestParam(required = false) Boolean includeZeroBalance,
            @Parameter(description = "Only include leaf accounts (default false)") @RequestParam(required = false) Boolean onlyLeafAccounts,
            @Parameter(description = "Include inactive accounts (default true)") @RequestParam(required = false) Boolean includeInactiveAccounts,
            @Parameter(description = "Expand accountId/accountIds to all sub-accounts (default false)") @RequestParam(required = false) Boolean includeSubAccounts,
            @Parameter(description = "Grouping: ACCOUNT, ACCOUNT_GROUP, ACCOUNT_TYPE, PARENT_ACCOUNT, BRANCH, COST_CENTER, PROJECT") @RequestParam(required = false) String groupBy,
            @Parameter(description = "Sort field: accountCode, accountName, periodDebit, periodCredit, transactionCount, lastTransactionDate") @RequestParam(required = false) String sortBy,
            @Parameter(description = "ASC or DESC") @RequestParam(required = false) String sortDirection,
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size (1-500)") @RequestParam(defaultValue = "10") int pageSize
    ) {
        TrialBalanceRequest req = new TrialBalanceRequest();
        req.setFromDate(fromDate);
        req.setToDate(toDate);
        req.setFiscalYearId(fiscalYearId);
        req.setCompanyId(companyId);
        req.setAccountId(accountId);
        req.setAccountIds(accountIds);
        req.setAccountCode(accountCode);
        req.setSearch(search);
        req.setAccountType(accountType);
        req.setAccountGroupId(accountGroupId);
        req.setCategoryId(categoryId);
        req.setParentAccountId(parentAccountId);
        req.setBranchId(branchId);
        req.setCostCenterId(costCenterId);
        req.setProjectId(projectId);
        req.setDepartmentId(departmentId);
        req.setCurrencyCode(currencyCode);
        req.setOnlyPostedEntries(onlyPostedEntries);
        req.setIncludeOpeningBalance(includeOpeningBalance);
        req.setIncludeZeroBalance(includeZeroBalance);
        req.setOnlyLeafAccounts(onlyLeafAccounts);
        req.setIncludeInactiveAccounts(includeInactiveAccounts);
        req.setIncludeSubAccounts(includeSubAccounts);
        req.setGroupBy(groupBy);
        req.setSortBy(sortBy);
        req.setSortDirection(sortDirection);
        req.setPage(page);
        req.setPageSize(pageSize);

        TrialBalanceResponse resp = trialBalanceService.generateTrialBalance(req);
        return ApiResponse.success(resp, "Report generated successfully");
    }
}
