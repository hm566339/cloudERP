package com.erp.account.modules.reporting.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.report.dto.response.TrialBalanceResponse;
import com.erp.account.modules.reporting.dto.request.ReportFilter;
import com.erp.account.modules.reporting.service.ReportExportService;
import com.erp.account.modules.reporting.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
// import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportExportManager;
import com.erp.account.security.CurrentUserContext;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping({ "/api/account/reports" })
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ReportExportService reportExportService;
    private final ReportExportManager reportExportManager;

    @PostMapping("/export/{reportName}")
    public void exportReport(
            @PathVariable String reportName,
            @RequestParam(required = false) UUID companyId,
            @RequestBody RequestWrapper<ReportExportRequest> requestWrapper,
            HttpServletResponse response) throws IOException {
        ReportExportRequest request = requestWrapper != null ? requestWrapper.unwrap() : new ReportExportRequest();
        UUID effectiveCompanyId = companyId != null ? companyId : (request != null ? request.getCompanyId() : null);
        UUID resolvedCompanyId = CurrentUserContext.resolveCompanyIdForQuery(effectiveCompanyId);
        if (request != null) {
            request.setCompanyId(resolvedCompanyId);
        }
        reportExportManager.exportReport(reportName, request, response);
    }

    @GetMapping("/trial-balance")
    // @PreAuthorize("hasAuthority('REPORT_VIEW')")
    public ApiResponse<TrialBalanceResponse> trialBalance(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) UUID branchId,
            @RequestParam(required = false) UUID costCenterId,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false) String currency,
            @RequestParam(required = false) UUID companyId) {
        ReportFilter filter = new ReportFilter();
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setBranchId(branchId);
        filter.setCostCenterId(costCenterId);
        filter.setProjectId(projectId);
        filter.setAccountId(accountId);
        filter.setCurrency(currency);
        filter.setCompanyId(companyId);

        TrialBalanceResponse resp = reportService.getTrialBalance(filter);
        return ApiResponse.success(resp, "Report generated successfully");
    }

    @GetMapping(path = "/trial-balance/pdf")
    // @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public void trialBalancePdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) UUID companyId,
            HttpServletResponse response) throws IOException {
        ReportFilter filter = new ReportFilter();
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setCompanyId(companyId);
        reportExportService.exportTrialBalancePdf(filter, response);
    }

    @GetMapping(path = "/trial-balance/excel")
    // @PreAuthorize("hasAuthority('REPORT_EXPORT')")
    public void trialBalanceExcel(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) UUID companyId,
            HttpServletResponse response) throws IOException {
        ReportFilter filter = new ReportFilter();
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setCompanyId(companyId);
        reportExportService.exportTrialBalanceExcel(filter, response);
    }
}
