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
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/account/v1/settings/warranty-terms")
@RequiredArgsConstructor
@Tag(name = "Settings - Warranty Terms", description = "APIs for managing configurable warranty terms")
public class WarrantyTermController {

    private final WarrantyTermService service;

    @Operation(summary = "Get all warranty terms for a company")
    @GetMapping
    public ResponseEntity<ApiResponse<List<WarrantyTermResponseDTO>>> getAllWarrantyTerms(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @RequestParam(value = "documentType", required = false) com.erp.account.modules.common.enums.SalesDocumentType documentType) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched GET /api/account/v1/settings/warranty-terms, effectiveCompanyId: {}, documentType: {}",
                effectiveCompanyId, documentType);
        List<WarrantyTermResponseDTO> result = service.getAllWarrantyTerms(effectiveCompanyId, documentType);
        log.info("[SETTINGS API] Response 200 OK for GET /api/account/v1/settings/warranty-terms, count: {}", result.size());
        return ResponseEntity.ok(ApiResponse.success(result, "Warranty terms fetched successfully"));
    }

    @Operation(summary = "Get warranty term by id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WarrantyTermResponseDTO>> getWarrantyTermById(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched GET /api/account/v1/settings/warranty-terms/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        WarrantyTermResponseDTO result = service.getWarrantyTermById(effectiveCompanyId, id);
        log.info("[SETTINGS API] Response 200 OK for GET /api/account/v1/settings/warranty-terms/{}", id);
        return ResponseEntity.ok(ApiResponse.success(result, "Warranty term fetched successfully"));
    }

    @Operation(summary = "Create warranty term")
    @PostMapping
    public ResponseEntity<ApiResponse<WarrantyTermResponseDTO>> createWarrantyTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @Valid @RequestBody RequestWrapper<WarrantyTermRequestDTO> requestWrapper) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        WarrantyTermRequestDTO dto = requestWrapper.unwrap();
        log.info("[SETTINGS API] Matched POST /api/account/v1/settings/warranty-terms, effectiveCompanyId: {}, documentType: {}, name: {}",
                effectiveCompanyId, dto.getDocumentType(), dto.getName());
        WarrantyTermResponseDTO created = service.createWarrantyTerm(effectiveCompanyId, dto);
        log.info("[SETTINGS API] Response 201 CREATED for POST /api/account/v1/settings/warranty-terms, createdId: {}", created.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Warranty term created successfully", HttpStatus.CREATED));
    }

    @Operation(summary = "Update warranty term")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WarrantyTermResponseDTO>> updateWarrantyTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<WarrantyTermRequestDTO> requestWrapper) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched PUT /api/account/v1/settings/warranty-terms/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        WarrantyTermResponseDTO updated = service.updateWarrantyTerm(effectiveCompanyId, id, requestWrapper.unwrap());
        log.info("[SETTINGS API] Response 200 OK for PUT /api/account/v1/settings/warranty-terms/{}", id);
        return ResponseEntity.ok(ApiResponse.success(updated, "Warranty term updated successfully"));
    }

    @Operation(summary = "Delete warranty term")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteWarrantyTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched DELETE /api/account/v1/settings/warranty-terms/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        service.deleteWarrantyTerm(effectiveCompanyId, id);
        log.info("[SETTINGS API] Response 200 OK for DELETE /api/account/v1/settings/warranty-terms/{}", id);
        return ResponseEntity.ok(ApiResponse.success(null, "Warranty term deleted successfully"));
    }
}

