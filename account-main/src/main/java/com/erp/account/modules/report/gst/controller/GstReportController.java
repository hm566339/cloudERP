package com.erp.account.modules.report.gst.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.report.gst.dto.*;
import com.erp.account.modules.report.gst.facade.GstReportFacade;
import com.erp.account.modules.report.gst.exporter.ReportExporter;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account/reports/gst")
@RequiredArgsConstructor
@Tag(name = "GST Reports", description = "Endpoints for all GST related reporting utilizing Clean Architecture")
public class GstReportController {

    private final GstReportFacade facade;
    private final ReportExporter exporter;
    private final com.erp.account.modules.report.gst.service.Gstr2bReconciliationService gstr2bReconciliationService;

    @PostMapping("/summary")
    @Operation(
            summary = "Get overall GST Summary",
            description = "Returns an enterprise GST dashboard with summary, tax summary, ITC summary, " +
                    "GST liability, supply summary, statistics, chart datasets (monthly trends, GST distribution, " +
                    "state-wise and HSN-wise tax), export options and audit metadata. All flat legacy fields are " +
                    "retained for backward compatibility.",
            responses = {
                    @io.swagger.v3.oas.annotations.responses.ApiResponse(
                            responseCode = "200",
                            description = "GST summary dashboard retrieved successfully",
                            content = @Content(
                                    mediaType = "application/json",
                                    schema = @Schema(implementation = ApiResponse.class),
                                    examples = @ExampleObject(
                                            name = "gstSummaryDashboard",
                                            summary = "Structured GST dashboard response",
                                            value = """
                                                    {
                                                      "success": true,
                                                      "message": "GST summary retrieved successfully",
                                                      "status": 200,
                                                      "data": {
                                                        "summary": {
                                                          "companyId": 1,
                                                          "companyName": "Acme Traders Pvt Ltd",
                                                          "companyCode": "ACME",
                                                          "gstin": "29AABCA1234A1Z5",
                                                          "financialYear": "FY2025-26",
                                                          "fromDate": "2025-04-01",
                                                          "toDate": "2026-03-31",
                                                          "baseCurrency": "INR",
                                                          "reportType": "SUMMARY",
                                                          "generatedAt": "2026-08-05T10:30:00Z",
                                                          "generatedBy": "SYSTEM_ADMIN"
                                                        },
                                                        "taxSummary": {
                                                          "taxableAmount": 1250000.00,
                                                          "cgst": 62500.00,
                                                          "sgst": 62500.00,
                                                          "igst": 87500.00,
                                                          "cess": 2500.00,
                                                          "totalTax": 215000.00
                                                        },
                                                        "itcSummary": {
                                                          "openingITC": 18000.00,
                                                          "availableITC": 96000.00,
                                                          "eligibleITC": 96000.00,
                                                          "blockedITC": 0.00,
                                                          "reversedITC": 0.00,
                                                          "utilizedITC": 83500.00,
                                                          "closingITC": 30500.00
                                                        },
                                                        "gstLiability": {
                                                          "outputGST": 215000.00,
                                                          "inputGST": 96000.00,
                                                          "reverseCharge": 0.00,
                                                          "interest": 0.00,
                                                          "lateFee": 0.00,
                                                          "netGSTLiability": 119000.00
                                                        },
                                                        "supplySummary": {
                                                          "taxableSupply": 1250000.00,
                                                          "zeroRatedSupply": 0.00,
                                                          "nilRatedSupply": 0.00,
                                                          "exemptSupply": 0.00,
                                                          "exportSupply": 0.00,
                                                          "importSupply": 0.00,
                                                          "sezSupply": 0.00,
                                                          "interstateSupply": 875000.00,
                                                          "intrastateSupply": 375000.00
                                                        },
                                                        "statistics": {
                                                          "salesInvoiceCount": 124,
                                                          "purchaseInvoiceCount": 68,
                                                          "creditNoteCount": 3,
                                                          "debitNoteCount": 1,
                                                          "customerCount": 42,
                                                          "vendorCount": 18,
                                                          "totalTransactions": 196
                                                        },
                                                        "charts": {
                                                          "monthlyTaxTrend": [],
                                                          "monthlyITCTrend": [],
                                                          "monthlyLiabilityTrend": [],
                                                          "gstDistribution": [],
                                                          "stateWiseTax": [],
                                                          "hsnWiseTax": []
                                                        },
                                                        "exportOptions": {
                                                          "pdfAvailable": true,
                                                          "excelAvailable": true,
                                                          "csvAvailable": true,
                                                          "printAvailable": true
                                                        },
                                                        "audit": {
                                                          "generatedAt": "2026-08-05T10:30:00Z",
                                                          "generatedBy": "SYSTEM_ADMIN",
                                                          "reportVersion": "1.0.0"
                                                        },
                                                        "taxableAmount": 1250000.00,
                                                        "cgst": 62500.00,
                                                        "sgst": 62500.00,
                                                        "igst": 87500.00,
                                                        "cess": 2500.00,
                                                        "totalTax": 215000.00,
                                                        "outputGst": 215000.00,
                                                        "inputGst": 96000.00,
                                                        "availableItc": 96000.00,
                                                        "utilizedItc": 83500.00,
                                                        "netGstLiability": 119000.00,
                                                        "reverseCharge": 0.00,
                                                        "zeroRatedSupply": 0.00,
                                                        "nilRatedSupply": 0.00,
                                                        "exemptSupply": 0.00
                                                      }
                                                    }""")
                            )
                    )
            })
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','COMPANY_ADMIN','ACCOUNTANT','VIEWER','OWNER') or hasAuthority('ROLE_OWNER') or hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<GstSummaryDto>> getSummary(
            @RequestParam(required = false) java.util.UUID companyId,
            @Valid @RequestBody(required = false) RequestWrapper<GstReportFilterDto> requestWrapper) {
        GstReportFilterDto filter = requestWrapper != null && requestWrapper.unwrap() != null
                ? requestWrapper.unwrap()
                : new GstReportFilterDto();
        if (filter.getCompanyId() == null && companyId != null) {
            filter.setCompanyId(companyId);
        }
        validateFilter(filter);
        GstSummaryDto response = facade.getGstSummary(filter);
        return ResponseEntity.ok(ApiResponse.success(response, "GST summary retrieved successfully"));
    }

    @PostMapping("/gstr1")
    @Operation(summary = "Get GSTR-1 Data with Pagination")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','COMPANY_ADMIN','ACCOUNTANT','VIEWER','OWNER') or hasAuthority('ROLE_OWNER') or hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<Gstr1ReportResponse>> getGstr1(
            @RequestParam(required = false) java.util.UUID companyId,
            @Valid @RequestBody GstReportRequest request) {
        GstReportFilterDto filter = request.getFilters();
        if (filter != null) {
            if (filter.getCompanyId() == null && companyId != null) {
                filter.setCompanyId(companyId);
            }
            validateFilter(filter);
        } else {
            filter = new GstReportFilterDto();
            if (companyId != null) {
                filter.setCompanyId(companyId);
            }
            request.setFilters(filter);
        }
        Page<Gstr1Dto> page = facade.getGstr1(request);
        
        // Compute summary manually or from an existing aggregate method.
        // For backward compatibility we will query summary aggregate based on the same filters.
        GstSummaryDto summaryData = facade.getGstSummary(filter);
        Gstr1SummaryResponse summary = Gstr1SummaryResponse.builder()
                .totalInvoices(summaryData.getStatistics().getSalesInvoiceCount())
                .totalTaxableAmount(summaryData.getTaxSummary().getTaxableAmount())
                .totalCgst(summaryData.getTaxSummary().getCgst())
                .totalSgst(summaryData.getTaxSummary().getSgst())
                .totalIgst(summaryData.getTaxSummary().getIgst())
                .totalCess(summaryData.getTaxSummary().getCess())
                .totalInvoiceValue(summaryData.getTaxSummary().getTaxableAmount().add(summaryData.getTaxSummary().getTotalTax())) // Approximation for total invoice value
                .build();
                
        Gstr1ReportResponse reportResponse = Gstr1ReportResponse.builder()
                .records(page.getContent())
                .summary(summary)
                .pagination(com.erp.account.common.dto.response.PaginationResponse.builder()
                        .page(page.getNumber() + 1)
                        .size(page.getSize())
                        .totalElements(page.getTotalElements())
                        .totalPages(page.getTotalPages())
                        .hasNext(page.hasNext())
                        .hasPrevious(page.hasPrevious())
                        .build())
                .build();
                
        return ResponseEntity.ok(ApiResponse.success(reportResponse, "GSTR-1 retrieved successfully"));
    }

    @PostMapping("/gstr3b")
    @Operation(summary = "Get GSTR-3B summary report")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','COMPANY_ADMIN','ACCOUNTANT','VIEWER','OWNER') or hasAuthority('ROLE_OWNER') or hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<Gstr3bDto>> getGstr3b(
            @RequestParam(required = false) java.util.UUID companyId,
            @Valid @RequestBody GstReportRequest request) {
        if (request.getFilters() != null && request.getFilters().getCompanyId() == null && companyId != null) {
            request.getFilters().setCompanyId(companyId);
        }
        Gstr3bDto response = facade.getGstr3b(request);
        return ResponseEntity.ok(ApiResponse.success(response, "GSTR-3B Summary retrieved successfully"));
    }

    @PostMapping("/hsn-summary")
    @Operation(summary = "Get HSN summary report")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','COMPANY_ADMIN','ACCOUNTANT','VIEWER','OWNER') or hasAuthority('ROLE_OWNER') or hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<HsnSummaryResponse>> getHsnSummary(
            @RequestParam(required = false) java.util.UUID companyId,
            @Valid @RequestBody GstReportRequest request) {
        if (request.getFilters() != null && request.getFilters().getCompanyId() == null && companyId != null) {
            request.getFilters().setCompanyId(companyId);
        }
        HsnSummaryResponse response = facade.getHsnSummary(request);
        return ResponseEntity.ok(ApiResponse.success(response, "HSN summary retrieved successfully"));
    }

    @PostMapping("/itc")
    @Operation(summary = "Get ITC report")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','COMPANY_ADMIN','ACCOUNTANT','VIEWER','OWNER') or hasAuthority('ROLE_OWNER') or hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<ItcReportDto>> getItcReport(
            @RequestParam(required = false) java.util.UUID companyId,
            @Valid @RequestBody GstReportRequest request) {
        if (request.getFilters() != null && request.getFilters().getCompanyId() == null && companyId != null) {
            request.getFilters().setCompanyId(companyId);
        }
        ItcReportDto response = facade.getItcReport(request);
        return ResponseEntity.ok(ApiResponse.success(response, "ITC report retrieved successfully"));
    }

    @PostMapping("/gstr2b/reconcile")
    @Operation(summary = "Reconcile Purchase Register with GSTR-2B")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN','COMPANY_ADMIN','ACCOUNTANT','VIEWER','OWNER') or hasAuthority('ROLE_OWNER') or hasAuthority('OWNER')")
    public ResponseEntity<ApiResponse<Gstr2bReconciliationDto>> reconcileGstr2b(
            @RequestParam(required = false) java.util.UUID companyId,
            @Valid @RequestBody Gstr2bReconciliationRequest request) {
        if (request.getCompanyId() == null && companyId != null) {
            request.setCompanyId(companyId);
        }
        Gstr2bReconciliationDto response = gstr2bReconciliationService.reconcileGstr2b(request);
        return ResponseEntity.ok(ApiResponse.success(response, "GSTR-2B reconciliation completed successfully"));
    }

    @PostMapping("/export/{type}")
    @Operation(summary = "Export Report (PDF, EXCEL, CSV)")
    @PreAuthorize("hasAuthority('REPORT_EXPORT') or hasAnyRole('SYSTEM_ADMIN','COMPANY_ADMIN','ACCOUNTANT','OWNER') or hasAuthority('ROLE_OWNER') or hasAuthority('OWNER')")
    public ResponseEntity<org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody> exportReport(
            @PathVariable String type,
            @RequestParam(required = false, defaultValue = "SUMMARY") String reportName,
            @RequestParam(required = false) java.util.UUID companyId,
            @Valid @RequestBody RequestWrapper<GstReportFilterDto> requestWrapper) {

        GstReportFilterDto filter = requestWrapper.unwrap();
        if (filter.getCompanyId() == null && companyId != null) {
            filter.setCompanyId(companyId);
        }
        validateFilter(filter);
        Object reportData;
        var rt = com.erp.account.modules.report.gst.enums.ReportType.fromString(reportName);
        if (rt == null) throw new IllegalArgumentException("Unsupported report name: " + reportName);
        switch (rt) {
            case SUMMARY -> reportData = facade.getGstSummary(filter);
            case GSTR1 -> {
                GstReportRequest request = new GstReportRequest();
                request.setFilters(filter);
                // large max size for export
                request.getPagination().setSize(100000);
                reportData = facade.getGstr1(request).getContent();
            }
            case GSTR3B -> {
                GstReportRequest request = new GstReportRequest();
                request.setFilters(filter);
                reportData = facade.getGstr3b(request);
            }
            case HSN_SUMMARY -> {
                GstReportRequest request = new GstReportRequest();
                request.setFilters(filter);
                request.getPagination().setSize(100000);
                reportData = facade.getHsnSummary(request).getRecords();
            }
            case ITC -> {
                GstReportRequest request = new GstReportRequest();
                request.setFilters(filter);
                reportData = facade.getItcReport(request);
            }
            default -> throw new IllegalArgumentException("Unsupported report name: " + reportName);
        }

        HttpHeaders headers = new HttpHeaders();
        MediaType mediaType;
        String fileName = reportName;
        var et = com.erp.account.modules.report.gst.enums.ExportType.fromString(type);
        if (et == null) throw new IllegalArgumentException("Unsupported export type: " + type);
        switch (et) {
            case PDF -> {
                mediaType = MediaType.APPLICATION_PDF;
                fileName = reportName + ".pdf";
            }
            case EXCEL -> {
                mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                fileName = reportName + ".xlsx";
            }
            case CSV -> {
                mediaType = MediaType.parseMediaType("text/csv");
                fileName = reportName + ".csv";
            }
            default -> mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        headers.setContentType(mediaType);
        headers.setContentDispositionFormData("attachment", fileName);

        org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody stream = out -> {
            exporter.streamExport(type, reportData, filter, reportName, out);
        };

        return ResponseEntity.ok().headers(headers).body(stream);
    }

    private void validateFilter(GstReportFilterDto filter) {
        if (filter.getFromDate() != null && filter.getToDate() != null && filter.getFromDate().isAfter(filter.getToDate())) {
            throw new IllegalArgumentException("fromDate must be before or equal to toDate");
        }
    }
}
