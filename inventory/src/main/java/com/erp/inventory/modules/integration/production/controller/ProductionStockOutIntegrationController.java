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

@RestController
@RequestMapping("/api/inventory/integration/production")
@RequiredArgsConstructor
public class ProductionStockOutIntegrationController {

    private final ProductionStockOutIntegrationService service;

    @PostMapping("/stock-out")
    public ResponseEntity<ApiResponse<ProductionStockOutResponse>> createStockOut(
            @Valid @RequestBody ApiRequest<ProductionStockOutRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        ProductionStockOutResponse response = service.createStockOut(apiRequest.getData(),
                TenantUtils.resolveCompanyId(companyId));
        return ResponseEntity.ok(ApiResponse.success(response, "Production stock-out completed successfully"));
    }
}
