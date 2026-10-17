package com.erp.account.modules.settings.controller;

import com.erp.account.modules.settings.dto.request.PaymentTermRequestDTO;
import com.erp.account.modules.settings.dto.response.PaymentTermResponseDTO;
import com.erp.account.modules.settings.service.PaymentTermService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;

@Slf4j
@RestController
@RequestMapping("/api/account/v1/settings/payment-terms")
@RequiredArgsConstructor
@Tag(name = "Settings - Payment Terms", description = "APIs for managing configurable payment terms")
public class PaymentTermController {

    private final PaymentTermService service;

    @Operation(summary = "Get all payment terms for a company")
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentTermResponseDTO>>> getAllPaymentTerms(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @RequestParam(value = "documentType", required = false) com.erp.account.modules.common.enums.SalesDocumentType documentType) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched GET /api/account/v1/settings/payment-terms, effectiveCompanyId: {}, documentType: {}",
                effectiveCompanyId, documentType);
        List<PaymentTermResponseDTO> result = service.getAllPaymentTerms(effectiveCompanyId, documentType);
        log.info("[SETTINGS API] Response 200 OK for GET /api/account/v1/settings/payment-terms, count: {}", result.size());
        return ResponseEntity.ok(ApiResponse.success(result, "Payment terms fetched successfully"));
    }

    @Operation(summary = "Get payment term by id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentTermResponseDTO>> getPaymentTermById(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched GET /api/account/v1/settings/payment-terms/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        PaymentTermResponseDTO result = service.getPaymentTermById(effectiveCompanyId, id);
        log.info("[SETTINGS API] Response 200 OK for GET /api/account/v1/settings/payment-terms/{}", id);
        return ResponseEntity.ok(ApiResponse.success(result, "Payment term fetched successfully"));
    }

    @Operation(summary = "Create payment term")
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentTermResponseDTO>> createPaymentTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @Valid @RequestBody RequestWrapper<PaymentTermRequestDTO> requestWrapper) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        PaymentTermRequestDTO dto = requestWrapper.unwrap();
        log.info("[SETTINGS API] Matched POST /api/account/v1/settings/payment-terms, effectiveCompanyId: {}, documentType: {}, name: {}",
                effectiveCompanyId, dto.getDocumentType(), dto.getName());
        PaymentTermResponseDTO created = service.createPaymentTerm(effectiveCompanyId, dto);
        log.info("[SETTINGS API] Response 201 CREATED for POST /api/account/v1/settings/payment-terms, createdId: {}", created.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Payment term created successfully", HttpStatus.CREATED));
    }

    @Operation(summary = "Update payment term")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentTermResponseDTO>> updatePaymentTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<PaymentTermRequestDTO> requestWrapper) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched PUT /api/account/v1/settings/payment-terms/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        PaymentTermResponseDTO updated = service.updatePaymentTerm(effectiveCompanyId, id, requestWrapper.unwrap());
        log.info("[SETTINGS API] Response 200 OK for PUT /api/account/v1/settings/payment-terms/{}", id);
        return ResponseEntity.ok(ApiResponse.success(updated, "Payment term updated successfully"));
    }

    @Operation(summary = "Delete payment term")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePaymentTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched DELETE /api/account/v1/settings/payment-terms/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        service.deletePaymentTerm(effectiveCompanyId, id);
        log.info("[SETTINGS API] Response 200 OK for DELETE /api/account/v1/settings/payment-terms/{}", id);
        return ResponseEntity.ok(ApiResponse.success(null, "Payment term deleted successfully"));
    }
}

