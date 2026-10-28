package com.erp.account.modules.einvoice.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.einvoice.dto.*;
import com.erp.account.modules.einvoice.service.EInvoiceService;
import com.erp.account.util.TenantUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/einvoice")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "GST e-Invoice API", description = "Endpoints for GST e-Invoice generation, cancellation, status, and configuration")
public class EInvoiceController {

    private final EInvoiceService einvoiceService;

    @Operation(summary = "Request e-Invoice generation (Asynchronous via RabbitMQ)")
    @PostMapping("/invoices/{id}/generate")
    public ResponseEntity<ApiResponse<EInvoiceJobResponseDto>> generateEInvoice(
            @PathVariable UUID id,
            @RequestBody(required = false) EInvoiceGenerateRequestDto request,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("API request to generate e-Invoice for invoice={} tenant={}", id, effectiveCompanyId);

        EInvoiceJobResponseDto jobResponse = einvoiceService.requestGeneration(id, request, effectiveCompanyId);
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(ApiResponse.success(jobResponse, "e-Invoice generation job accepted and queued for processing"));
    }

    @Operation(summary = "Get e-Invoice status and IRN details for a sales invoice")
    @GetMapping("/invoices/{id}/status")
    public ResponseEntity<ApiResponse<EInvoiceStatusResponseDto>> getInvoiceStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        EInvoiceStatusResponseDto response = einvoiceService.getInvoiceStatus(id, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(response, "e-Invoice status retrieved successfully"));
    }

    @Operation(summary = "Get details of an asynchronous e-Invoice job")
    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<ApiResponse<EInvoiceJobResponseDto>> getJob(
            @PathVariable UUID jobId,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        EInvoiceJobResponseDto response = einvoiceService.getJob(jobId, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(response, "e-Invoice job details retrieved successfully"));
    }

    @Operation(summary = "Cancel an existing e-Invoice IRN")
    @PostMapping("/invoices/{id}/cancel")
    public ResponseEntity<ApiResponse<EInvoiceStatusResponseDto>> cancelEInvoice(
            @PathVariable UUID id,
            @Valid @RequestBody EInvoiceCancelRequestDto request,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        EInvoiceStatusResponseDto response = einvoiceService.cancelEInvoice(id, request, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(response, "e-Invoice cancelled successfully"));
    }

    @Operation(summary = "Reconcile uncertain or timed-out e-Invoice generation")
    @PostMapping("/invoices/{id}/reconcile")
    public ResponseEntity<ApiResponse<EInvoiceStatusResponseDto>> reconcileStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        EInvoiceStatusResponseDto response = einvoiceService.reconcileStatus(id, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(response, "e-Invoice reconciled successfully"));
    }

    @Operation(summary = "Get company/GSTIN e-Invoice provider configuration")
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<CompanyEInvoiceConfigDto>> getConfig(
            @RequestParam UUID gstRegistrationId,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        CompanyEInvoiceConfigDto config = einvoiceService.getConfig(effectiveCompanyId, gstRegistrationId);
        return ResponseEntity.ok(ApiResponse.success(config, "e-Invoice configuration retrieved successfully"));
    }

    @Operation(summary = "Save or update company/GSTIN e-Invoice provider configuration")
    @PutMapping("/config")
    public ResponseEntity<ApiResponse<CompanyEInvoiceConfigDto>> saveConfig(
            @Valid @RequestBody CompanyEInvoiceConfigDto dto,
            @RequestParam(required = false) UUID companyId) {
        UUID effectiveCompanyId = TenantUtils.resolveCompanyId(companyId);
        CompanyEInvoiceConfigDto saved = einvoiceService.saveConfig(dto, effectiveCompanyId);
        return ResponseEntity.ok(ApiResponse.success(saved, "e-Invoice configuration saved successfully"));
    }
}
