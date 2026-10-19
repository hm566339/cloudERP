package com.erp.inventory.modules.integration.production.controller;

import com.erp.inventory.common.dto.request.ApiRequest;
import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.production.dto.ProductionStockOutRequest;
import com.erp.inventory.modules.integration.production.dto.ProductionStockOutResponse;
import com.erp.inventory.modules.integration.production.service.ProductionStockOutIntegrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Slf4j
@RestController
@RequestMapping("/api/inventory/integration/production")
@RequiredArgsConstructor
public class ProductionStockOutIntegrationController {

    private final ProductionStockOutIntegrationService service;

    @PostMapping("/stock-out")
    public ResponseEntity<ApiResponse<ProductionStockOutResponse>> createStockOut(
            @Valid @RequestBody ApiRequest<ProductionStockOutRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductionStockOutRequest request = apiRequest.getData();
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        try {
            ProductionStockOutResponse response = service.createStockOut(request, resolvedCompanyId);
            return ResponseEntity.ok(ApiResponse.success(response, "Production stock-out completed successfully"));
        } catch (DataIntegrityViolationException exception) {
            String message = exception.getMessage() == null ? "" : exception.getMessage();
            String causeMessage = exception.getCause() == null || exception.getCause().getMessage() == null
                    ? "" : exception.getCause().getMessage();
            if (message.contains("uk_stock_movement_idempotency") || causeMessage.contains("uk_stock_movement_idempotency")) {
                log.warn("Concurrent duplicate production stock-out for idempotencyKey: {}", request.getIdempotencyKey());
                ProductionStockOutResponse response = service.getExistingStockOut(resolvedCompanyId, request.getIdempotencyKey(), request);
                return ResponseEntity.ok(ApiResponse.success(response, "Production stock-out already processed"));
            }
            throw exception;
        }
    }

    @GetMapping("/movements/by-idempotency/{idempotencyKey}")
    public ResponseEntity<ApiResponse<ProductionStockOutResponse>> getMovementByIdempotencyKey(
            @PathVariable UUID idempotencyKey,
            @RequestParam(required = false) UUID companyId) {
        ProductionStockOutResponse response = service.getMovementByIdempotencyKey(
                TenantUtils.resolveCompanyId(companyId), idempotencyKey);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
