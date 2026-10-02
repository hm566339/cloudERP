package com.erp.account.modules.settings.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.settings.dto.request.WarrantyTermRequestDTO;
import com.erp.account.modules.settings.dto.response.WarrantyTermResponseDTO;
import com.erp.account.modules.settings.service.WarrantyTermService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/v1/settings/warranty-terms")
@RequiredArgsConstructor
@Tag(name = "Settings - Warranty Terms", description = "APIs for managing configurable warranty terms")
public class WarrantyTermController {

    private final WarrantyTermService service;

    @Operation(summary = "Get all warranty terms for a company")
    @GetMapping
    public ResponseEntity<ApiResponse<List<WarrantyTermResponseDTO>>> getAllWarrantyTerms(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @RequestParam(value = "documentType", required = false) com.erp.account.modules.common.enums.SalesDocumentType documentType) {
        return ResponseEntity.ok(ApiResponse.success(service.getAllWarrantyTerms(companyId, documentType), "Warranty terms fetched successfully"));
    }

    @Operation(summary = "Get warranty term by id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarrantyTermResponseDTO>> getWarrantyTermById(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getWarrantyTermById(companyId, id), "Warranty term fetched successfully"));
    }

    @Operation(summary = "Create warranty term")
    @PostMapping
    public ResponseEntity<ApiResponse<WarrantyTermResponseDTO>> createWarrantyTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<WarrantyTermRequestDTO> requestWrapper) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.createWarrantyTerm(companyId, requestWrapper.unwrap()), "Warranty term created successfully", HttpStatus.CREATED));
    }

    @Operation(summary = "Update warranty term")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WarrantyTermResponseDTO>> updateWarrantyTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<WarrantyTermRequestDTO> requestWrapper) {
        return ResponseEntity.ok(ApiResponse.success(service.updateWarrantyTerm(companyId, id, requestWrapper.unwrap()), "Warranty term updated successfully"));
    }

    @Operation(summary = "Delete warranty term")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWarrantyTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id) {
        service.deleteWarrantyTerm(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Warranty term deleted successfully"));
    }
}
