package com.erp.account.modules.reporting.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.report.dto.response.GeneralLedgerResponse;
import com.erp.account.modules.reporting.dto.request.GeneralLedgerRequest;
import com.erp.account.modules.reporting.service.GeneralLedgerService;
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
import org.springframework.web.bind.annotation.ModelAttribute;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

@RestController
@RequestMapping("/api/account/v1/reports")
@RequiredArgsConstructor
@Slf4j
public class GeneralLedgerController {

    private final GeneralLedgerService generalLedgerService;

    @Operation(summary = "Generate General Ledger", description = "Generates a detailed General Ledger report with advanced filtering capabilities matching ERP standards.")
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "General Ledger generated successfully")
    })
    @GetMapping(value = "/general-ledger", produces = MediaType.APPLICATION_JSON_VALUE)
    public com.erp.account.common.dto.response.ApiResponse<GeneralLedgerResponse> generalLedger(
            @Parameter(description = "Company UUID (optional if set in context)") @RequestParam(required = false) UUID companyId,
            @Parameter(description = "Advanced filter options") @ModelAttribute GeneralLedgerRequest req) {

        GeneralLedgerResponse resp = generalLedgerService.generateGeneralLedger(req, companyId);
        return com.erp.account.common.dto.response.ApiResponse.success(resp, "Report generated successfully");
    }
}
