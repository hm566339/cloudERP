package com.erp.inventory.modules.integration.stock.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.integration.stock.dto.response.ProductStockIntegrationResponse;
import com.erp.inventory.modules.integration.stock.service.StockIntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/inventory/integration/stock")
@RequiredArgsConstructor
public class StockIntegrationController {

    private final StockIntegrationService stockIntegrationService;

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<List<ProductStockIntegrationResponse>>> getGroupedStock(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) UUID productId,
            @RequestParam(required = false) String search) {

        log.info("Received request to fetch grouped stock for company: {}, product: {}, search: {}", companyId, productId, search);

        List<ProductStockIntegrationResponse> response = stockIntegrationService.getGroupedStock(companyId, productId, search);

        return ResponseEntity.ok(
                ApiResponse.<List<ProductStockIntegrationResponse>>builder()
                        .success(true)
                        .message("Stock data fetched successfully")
                        .data(response)
                        .build());
    }
}
