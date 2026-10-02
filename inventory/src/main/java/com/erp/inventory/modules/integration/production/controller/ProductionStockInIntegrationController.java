package com.erp.inventory.modules.integration.production.controller;

import com.erp.inventory.common.dto.request.ApiRequest;
import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.common.util.TenantUtils;
import com.erp.inventory.modules.integration.production.dto.ProductionStockInRequest;
import com.erp.inventory.modules.integration.production.dto.ProductionStockInResponse;
import com.erp.inventory.modules.integration.production.dto.ProductionStockInCostedRequest;
import com.erp.inventory.modules.integration.production.dto.ProductionStockInCostedResponse;
import com.erp.inventory.modules.integration.production.service.ProductionStockInIntegrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/inventory/integration/production")
@RequiredArgsConstructor
public class ProductionStockInIntegrationController {

    private final ProductionStockInIntegrationService service;

    @PostMapping("/stock-in")
    public ResponseEntity<ApiResponse<ProductionStockInResponse>> createStockIn(
            @Valid @RequestBody ApiRequest<ProductionStockInRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductionStockInRequest request = apiRequest.getData();
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        try {
            ProductionStockInResponse response = service.createStockIn(request, resolvedCompanyId);
            return ResponseEntity.ok(ApiResponse.success(response, "Production stock-in completed successfully"));
        } catch (DataIntegrityViolationException exception) {
            String message = exception.getMessage() == null ? "" : exception.getMessage();
            String causeMessage = exception.getCause() == null || exception.getCause().getMessage() == null
                    ? "" : exception.getCause().getMessage();
            if (message.contains("uk_stock_movement_idempotency")
                    || causeMessage.contains("uk_stock_movement_idempotency")) {
                log.warn("Concurrent duplicate production stock-in for idempotencyKey: {}", request.getIdempotencyKey());
                ProductionStockInResponse response = service.getExistingStockIn(
                        resolvedCompanyId, request.getIdempotencyKey(), request);
                return ResponseEntity.ok(ApiResponse.success(response, "Production stock-in already processed"));
            }
            throw exception;
        }
    }

    @PostMapping("/stock-in-costed")
    public ResponseEntity<ApiResponse<ProductionStockInCostedResponse>> createCostedStockIn(
            @Valid @RequestBody ApiRequest<ProductionStockInCostedRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductionStockInCostedRequest request = apiRequest.getData();
        ProductionStockInCostedResponse response = service.createCostedStockIn(request, TenantUtils.resolveCompanyId(companyId));
        return ResponseEntity.ok(ApiResponse.success(response, "Costed production stock-in completed successfully"));
    }
}