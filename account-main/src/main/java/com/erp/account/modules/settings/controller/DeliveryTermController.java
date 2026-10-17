package com.erp.account.modules.settings.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.settings.dto.request.DeliveryTermRequestDTO;
import com.erp.account.modules.settings.dto.response.DeliveryTermResponseDTO;
import com.erp.account.modules.settings.service.DeliveryTermService;
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
@RequestMapping("/api/account/v1/settings/delivery-terms")
@RequiredArgsConstructor
@Tag(name = "Settings - Delivery Terms", description = "APIs for managing configurable delivery terms")
public class DeliveryTermController {

    private final DeliveryTermService service;

    @Operation(summary = "Get all delivery terms for a company")
    @GetMapping
    public ResponseEntity<ApiResponse<List<DeliveryTermResponseDTO>>> getAllDeliveryTerms(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @RequestParam(value = "documentType", required = false) com.erp.account.modules.common.enums.SalesDocumentType documentType) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched GET /api/account/v1/settings/delivery-terms, effectiveCompanyId: {}, documentType: {}",
                effectiveCompanyId, documentType);
        List<DeliveryTermResponseDTO> result = service.getAllDeliveryTerms(effectiveCompanyId, documentType);
        log.info("[SETTINGS API] Response 200 OK for GET /api/account/v1/settings/delivery-terms, count: {}", result.size());
        return ResponseEntity.ok(ApiResponse.success(result, "Delivery terms fetched successfully"));
    }

    @Operation(summary = "Get delivery term by id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliveryTermResponseDTO>> getDeliveryTermById(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched GET /api/account/v1/settings/delivery-terms/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        DeliveryTermResponseDTO result = service.getDeliveryTermById(effectiveCompanyId, id);
        log.info("[SETTINGS API] Response 200 OK for GET /api/account/v1/settings/delivery-terms/{}", id);
        return ResponseEntity.ok(ApiResponse.success(result, "Delivery term fetched successfully"));
    }

    @Operation(summary = "Create delivery term")
    @PostMapping
    public ResponseEntity<ApiResponse<DeliveryTermResponseDTO>> createDeliveryTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @Valid @RequestBody RequestWrapper<DeliveryTermRequestDTO> requestWrapper) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        DeliveryTermRequestDTO dto = requestWrapper.unwrap();
        log.info("[SETTINGS API] Matched POST /api/account/v1/settings/delivery-terms, effectiveCompanyId: {}, documentType: {}, name: {}",
                effectiveCompanyId, dto.getDocumentType(), dto.getName());
        DeliveryTermResponseDTO created = service.createDeliveryTerm(effectiveCompanyId, dto);
        log.info("[SETTINGS API] Response 201 CREATED for POST /api/account/v1/settings/delivery-terms, createdId: {}", created.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Delivery term created successfully", HttpStatus.CREATED));
    }

    @Operation(summary = "Update delivery term")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliveryTermResponseDTO>> updateDeliveryTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<DeliveryTermRequestDTO> requestWrapper) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched PUT /api/account/v1/settings/delivery-terms/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        DeliveryTermResponseDTO updated = service.updateDeliveryTerm(effectiveCompanyId, id, requestWrapper.unwrap());
        log.info("[SETTINGS API] Response 200 OK for PUT /api/account/v1/settings/delivery-terms/{}", id);
        return ResponseEntity.ok(ApiResponse.success(updated, "Delivery term updated successfully"));
    }

    @Operation(summary = "Delete delivery term")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDeliveryTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID headerCompanyId,
            @RequestParam(value = "companyId", required = false) UUID paramCompanyId,
            @PathVariable UUID id) {
        UUID effectiveCompanyId = (headerCompanyId != null) ? headerCompanyId : paramCompanyId;
        log.info("[SETTINGS API] Matched DELETE /api/account/v1/settings/delivery-terms/{}, effectiveCompanyId: {}", id, effectiveCompanyId);
        service.deleteDeliveryTerm(effectiveCompanyId, id);
        log.info("[SETTINGS API] Response 200 OK for DELETE /api/account/v1/settings/delivery-terms/{}", id);
        return ResponseEntity.ok(ApiResponse.success(null, "Delivery term deleted successfully"));
    }
}

