package com.erp.account.modules.reporting.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.report.dto.response.ProfitLossResponse;
import com.erp.account.modules.reporting.dto.request.ProfitLossRequest;
import com.erp.account.modules.reporting.service.ProfitLossService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
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
public class ProfitLossController {

    private final ProfitLossService profitLossService;

    @Operation(summary = "Generate Profit and Loss report", description = "Retrieves an advanced Profit & Loss statement with grouping, filtering, variance analysis, and export options.")
    @GetMapping(value = "/profit-loss", produces = MediaType.APPLICATION_JSON_VALUE)
    public ApiResponse<ProfitLossResponse> profitLoss(
            @Parameter(description = "From date (yyyy-MM-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @Parameter(description = "To date (yyyy-MM-dd)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) UUID departmentId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID costCenterId,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) String accountType,
            @RequestParam(required = false) UUID ledgerGroupId,
            @RequestParam(required = false) String voucherType,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "false") Boolean includeZeroBalance,
            @RequestParam(required = false, defaultValue = "false") Boolean includeOpeningBalance,
            @RequestParam(required = false, defaultValue = "false") Boolean includeClosingBalance,
            @RequestParam(required = false, defaultValue = "false") Boolean includeSubAccounts,
            @RequestParam(required = false) String groupBy,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "false") Boolean export,
            @RequestParam(required = false) String exportFormat,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int pageSize
    ) {
        ProfitLossRequest request = new ProfitLossRequest();
        request.setFromDate(fromDate);
        request.setToDate(toDate);
        request.setCompanyId(companyId);
        request.setBranchId(branchId);
        request.setDepartmentId(departmentId);
        request.setProjectId(projectId);
        request.setCostCenterId(costCenterId);
        request.setAccountId(accountId);
        request.setAccountType(accountType);
        request.setLedgerGroupId(ledgerGroupId);
        request.setVoucherType(voucherType);
        request.setCurrency(currency);
        request.setStatus(status);
        request.setIncludeZeroBalance(includeZeroBalance);
        request.setIncludeOpeningBalance(includeOpeningBalance);
        request.setIncludeClosingBalance(includeClosingBalance);
        request.setIncludeSubAccounts(includeSubAccounts);
        request.setGroupBy(groupBy);
        request.setSortBy(sortBy);
        request.setSortDirection(sortDirection);
        request.setSearch(search);
        request.setExport(export);
        request.setExportFormat(exportFormat);
        request.setPage(page);
        request.setPageSize(pageSize);

        ProfitLossResponse response = profitLossService.generateProfitLoss(request);
        return ApiResponse.success(response, "Report generated successfully");
    }
}
