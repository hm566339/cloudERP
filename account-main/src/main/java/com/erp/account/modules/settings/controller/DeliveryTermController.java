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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/v1/settings/delivery-terms")
@RequiredArgsConstructor
@Tag(name = "Settings - Delivery Terms", description = "APIs for managing configurable delivery terms")
public class DeliveryTermController {

    private final DeliveryTermService service;

    @Operation(summary = "Get all delivery terms for a company")
    @GetMapping
    public ResponseEntity<ApiResponse<List<DeliveryTermResponseDTO>>> getAllDeliveryTerms(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @RequestParam(value = "documentType", required = false) com.erp.account.modules.common.enums.SalesDocumentType documentType) {
        return ResponseEntity.ok(ApiResponse.success(service.getAllDeliveryTerms(companyId, documentType), "Delivery terms fetched successfully"));
    }

    @Operation(summary = "Get delivery term by id")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliveryTermResponseDTO>> getDeliveryTermById(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.getDeliveryTermById(companyId, id), "Delivery term fetched successfully"));
    }

    @Operation(summary = "Create delivery term")
    @PostMapping
    public ResponseEntity<ApiResponse<DeliveryTermResponseDTO>> createDeliveryTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<DeliveryTermRequestDTO> requestWrapper) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.createDeliveryTerm(companyId, requestWrapper.unwrap()), "Delivery term created successfully", HttpStatus.CREATED));
    }

    @Operation(summary = "Update delivery term")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliveryTermResponseDTO>> updateDeliveryTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<DeliveryTermRequestDTO> requestWrapper) {
        return ResponseEntity.ok(ApiResponse.success(service.updateDeliveryTerm(companyId, id, requestWrapper.unwrap()), "Delivery term updated successfully"));
    }

    @Operation(summary = "Delete delivery term")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDeliveryTerm(
            @RequestHeader(value = "X-Company-Id", required = false) UUID companyId,
            @PathVariable UUID id) {
        service.deleteDeliveryTerm(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Delivery term deleted successfully"));
    }
}
