package com.erp.account.modules.settings.controller;

import com.erp.account.modules.settings.dto.request.TermsConditionRequestDTO;
import com.erp.account.modules.settings.dto.response.TermsConditionResponseDTO;
import com.erp.account.modules.settings.service.TermsConditionService;
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
@RequestMapping("/api/account/v1/settings/terms-conditions")
@RequiredArgsConstructor
@Tag(name = "Settings - Terms & Conditions", description = "APIs for managing general terms and conditions")
public class TermsConditionController {

    private final TermsConditionService service;

    @Operation(summary = "Get all terms & conditions for a company")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TermsConditionResponseDTO>>> getAllTermsConditions(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @RequestParam(value = "documentType", required = false) com.erp.account.modules.common.enums.SalesDocumentType documentType) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched GET /api/account/v1/settings/terms-conditions, effectiveCompanyId: {}, documentType: {}",
                effectiveCompanyId, documentType);
        List<TermsConditionResponseDTO> result = service.getAllTermsConditions(effectiveCompanyId, documentType);
        log.info("[SETTINGS API] Response 200 OK for GET /api/account/v1/settings/terms-conditions, count: {}", result.size());
        return ResponseEntity.ok(ApiResponse.success(result,
                "Terms & conditions fetched successfully"));
    }

    @Operation(summary = "Get terms & conditions by id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TermsConditionResponseDTO>> getTermsConditionById(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched GET /api/account/v1/settings/terms-conditions/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        TermsConditionResponseDTO result = service.getTermsConditionById(effectiveCompanyId, id);
        log.info("[SETTINGS API] Response 200 OK for GET /api/account/v1/settings/terms-conditions/{}", id);
        return ResponseEntity.ok(ApiResponse.success(result,
                "Terms & conditions fetched successfully"));
    }

    @Operation(summary = "Create terms & conditions")
    @PostMapping
    public ResponseEntity<ApiResponse<TermsConditionResponseDTO>> createTermsCondition(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @Valid @RequestBody RequestWrapper<TermsConditionRequestDTO> requestWrapper) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        TermsConditionRequestDTO dto = requestWrapper.unwrap();
        log.info("[SETTINGS API] Matched POST /api/account/v1/settings/terms-conditions, effectiveCompanyId: {}, documentType: {}, title: {}",
                effectiveCompanyId, dto.getDocumentType(), dto.getTitle());
        TermsConditionResponseDTO created = service.createTermsCondition(effectiveCompanyId, dto);
        log.info("[SETTINGS API] Response 201 CREATED for POST /api/account/v1/settings/terms-conditions, createdId: {}", created.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created,
                        "Terms & conditions created successfully", HttpStatus.CREATED));
    }

    @Operation(summary = "Update terms & conditions")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TermsConditionResponseDTO>> updateTermsCondition(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<TermsConditionRequestDTO> requestWrapper) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched PUT /api/account/v1/settings/terms-conditions/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        TermsConditionResponseDTO updated = service.updateTermsCondition(effectiveCompanyId, id, requestWrapper.unwrap());
        log.info("[SETTINGS API] Response 200 OK for PUT /api/account/v1/settings/terms-conditions/{}", id);
        return ResponseEntity
                .ok(ApiResponse.success(updated,
                        "Terms & conditions updated successfully"));
    }

    @Operation(summary = "Delete terms & conditions")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTermsCondition(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched DELETE /api/account/v1/settings/terms-conditions/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        service.deleteTermsCondition(effectiveCompanyId, id);
        log.info("[SETTINGS API] Response 200 OK for DELETE /api/account/v1/settings/terms-conditions/{}", id);
        return ResponseEntity.ok(ApiResponse.success(null, "Terms & conditions deleted successfully"));
    }
}

