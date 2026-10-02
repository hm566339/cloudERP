package com.erp.account.modules.settings.controller;

import com.erp.account.modules.settings.dto.request.TermsConditionRequestDTO;
import com.erp.account.modules.settings.dto.response.TermsConditionResponseDTO;
import com.erp.account.modules.settings.service.TermsConditionService;
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
@RequestMapping("/api/account/v1/settings/terms-conditions")
@RequiredArgsConstructor
@Tag(name = "Settings - Terms & Conditions", description = "APIs for managing general terms and conditions")
public class TermsConditionController {

    private final TermsConditionService service;

    @Operation(summary = "Get all terms & conditions for a company")
    @GetMapping
    public ResponseEntity<ApiResponse<List<TermsConditionResponseDTO>>> getAllTermsConditions(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @RequestParam(value = "documentType", required = false) com.erp.account.modules.common.enums.SalesDocumentType documentType) {
        return ResponseEntity.ok(ApiResponse.success(service.getAllTermsConditions(companyId, documentType),
                "Terms & conditions fetched successfully"));
    }

    @Operation(summary = "Get terms & conditions by id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TermsConditionResponseDTO>> getTermsConditionById(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getTermsConditionById(companyId, id),
                "Terms & conditions fetched successfully"));
    }

    @Operation(summary = "Create terms & conditions")
    @PostMapping
    public ResponseEntity<ApiResponse<TermsConditionResponseDTO>> createTermsCondition(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<TermsConditionRequestDTO> requestWrapper) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.createTermsCondition(companyId, requestWrapper.unwrap()),
                        "Terms & conditions created successfully", HttpStatus.CREATED));
    }

    @Operation(summary = "Update terms & conditions")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TermsConditionResponseDTO>> updateTermsCondition(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<TermsConditionRequestDTO> requestWrapper) {
        return ResponseEntity
                .ok(ApiResponse.success(service.updateTermsCondition(companyId, id, requestWrapper.unwrap()),
                        "Terms & conditions updated successfully"));
    }

    @Operation(summary = "Delete terms & conditions")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTermsCondition(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id) {
        service.deleteTermsCondition(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Terms & conditions deleted successfully"));
    }
}
