package com.erp.account.modules.reporting.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.reporting.dto.response.CashFlowReportResponse;
import com.erp.account.modules.reporting.service.CashFlowReportService;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;


import org.springframework.web.bind.annotation.ModelAttribute;
import com.erp.account.modules.reporting.dto.request.CashFlowRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/account/reports/cash-flow")
@RequiredArgsConstructor
public class CashFlowReportController {

    private final CashFlowReportService cashFlowReportService;

    @io.swagger.v3.oas.annotations.Operation(summary = "Generate Cash Flow report", description = "Retrieves an enterprise-grade Cash Flow statement broken down by Operating, Investing, and Financing activities, along with bank accounts and detailed transactions.")
    @GetMapping
    public ResponseEntity<ApiResponse<CashFlowReportResponse>> getCashFlowReport(@Valid @ModelAttribute CashFlowRequest request) {
        CashFlowReportResponse response = cashFlowReportService.getCashFlowReport(request);
        return ResponseEntity.ok(ApiResponse.success(response, "Cash flow report generated successfully"));
    }
}
