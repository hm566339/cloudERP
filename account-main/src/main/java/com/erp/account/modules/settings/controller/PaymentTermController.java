package com.erp.account.modules.settings.controller;

import com.erp.account.modules.settings.dto.request.PaymentTermRequestDTO;
import com.erp.account.modules.settings.dto.response.PaymentTermResponseDTO;
import com.erp.account.modules.settings.service.PaymentTermService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;

@RestController
@RequestMapping("/api/account/v1/settings/payment-terms")
@RequiredArgsConstructor
@Tag(name = "Settings - Payment Terms", description = "APIs for managing configurable payment terms")
public class PaymentTermController {

    private final PaymentTermService service;

    @Operation(summary = "Get all payment terms for a company")
    @GetMapping
    public ResponseEntity<ApiResponse<List<PaymentTermResponseDTO>>> getAllPaymentTerms(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @RequestParam(value = "documentType", required = false) com.erp.account.modules.common.enums.SalesDocumentType documentType) {
        return ResponseEntity.ok(ApiResponse.success(service.getAllPaymentTerms(companyId, documentType),
                "Payment terms fetched successfully"));
    }

    @Operation(summary = "Get payment term by id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentTermResponseDTO>> getPaymentTermById(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(
                ApiResponse.success(service.getPaymentTermById(companyId, id), "Payment term fetched successfully"));
    }

    @Operation(summary = "Create payment term")
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentTermResponseDTO>> createPaymentTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<PaymentTermRequestDTO> requestWrapper) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.createPaymentTerm(companyId, requestWrapper.unwrap()),
                        "Payment term created successfully", HttpStatus.CREATED));
    }

    @Operation(summary = "Update payment term")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PaymentTermResponseDTO>> updatePaymentTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<PaymentTermRequestDTO> requestWrapper) {
        return ResponseEntity.ok(ApiResponse.success(service.updatePaymentTerm(companyId, id, requestWrapper.unwrap()),
                "Payment term updated successfully"));
    }

    @Operation(summary = "Delete payment term")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePaymentTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id) {
        service.deletePaymentTerm(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Payment term deleted successfully"));
    }
}
