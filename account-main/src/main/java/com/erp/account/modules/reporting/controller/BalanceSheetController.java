package com.erp.account.modules.reporting.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.report.dto.response.BalanceSheetResponse;
import com.erp.account.modules.reporting.dto.request.BalanceSheetRequest;
import com.erp.account.modules.reporting.service.BalanceSheetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/v1/reports")
@RequiredArgsConstructor
@Slf4j
public class BalanceSheetController {

    private final BalanceSheetService balanceSheetService;

    @Operation(summary = "Generate Balance Sheet report", description = "Retrieves an advanced, hierarchical Balance Sheet statement with comparison and export capabilities.")
    @GetMapping(value = "/balance-sheet", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<BalanceSheetResponse> balanceSheet(
            @Parameter(description = "From date (yyyy-MM-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @Parameter(description = "To date (yyyy-MM-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID costCenterId,
            @RequestParam(required = false) UUID warehouseId,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) String accountType,
            @RequestParam(required = false) UUID accountGroupId,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "false") Boolean includeZeroBalance,
            @RequestParam(required = false, defaultValue = "false") Boolean includeOpeningBalance,
            @RequestParam(required = false, defaultValue = "false") Boolean includeClosingBalance,
            @RequestParam(required = false, defaultValue = "false") Boolean includeSubAccounts,
            @RequestParam(required = false, defaultValue = "false") Boolean includeInactiveAccounts,
            @RequestParam(required = false) String groupBy,
            @RequestParam(required = false) String hierarchyLevel,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false, defaultValue = "false") Boolean compareWithPreviousPeriod,
            @Parameter(description = "Previous from date (yyyy-MM-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate previousPeriodFromDate,
            @Parameter(description = "Previous to date (yyyy-MM-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate previousPeriodToDate,
            @RequestParam(required = false, defaultValue = "false") Boolean export,
            @RequestParam(required = false) String exportFormat,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize
    ) {
        BalanceSheetRequest request = new BalanceSheetRequest();
        request.setFromDate(fromDate);
        request.setToDate(toDate);
        request.setCompanyId(companyId);
        request.setBranchId(branchId);
        request.setDepartmentId(departmentId);
        request.setProjectId(projectId);
        request.setCostCenterId(costCenterId);
        request.setWarehouseId(warehouseId);
        request.setAccountId(accountId);
        request.setAccountType(accountType);
        request.setAccountGroupId(accountGroupId);
        request.setCurrency(currency);
        request.setStatus(status);
        request.setIncludeZeroBalance(includeZeroBalance);
        request.setIncludeOpeningBalance(includeOpeningBalance);
        request.setIncludeClosingBalance(includeClosingBalance);
        request.setIncludeSubAccounts(includeSubAccounts);
        request.setIncludeInactiveAccounts(includeInactiveAccounts);
        request.setGroupBy(groupBy);
        request.setHierarchyLevel(hierarchyLevel);
        request.setSearch(search);
        request.setSortBy(sortBy);
        request.setSortDirection(sortDirection);
        request.setCompareWithPreviousPeriod(compareWithPreviousPeriod);
        request.setPreviousPeriodFromDate(previousPeriodFromDate);
        request.setPreviousPeriodToDate(previousPeriodToDate);
        request.setExport(export);
        request.setExportFormat(exportFormat);
        request.setPage(page);
        request.setPageSize(pageSize);

        BalanceSheetResponse response = balanceSheetService.generateBalanceSheet(request);
        return ApiResponse.success(response, "Report generated successfully");
    }
}
