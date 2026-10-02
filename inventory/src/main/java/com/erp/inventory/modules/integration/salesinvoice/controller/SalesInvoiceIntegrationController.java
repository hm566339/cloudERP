package com.erp.inventory.modules.integration.salesinvoice.controller;

import com.erp.inventory.common.dto.request.ApiRequest;
import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.integration.salesinvoice.dto.request.SalesInvoiceStockOutRequest;
import com.erp.inventory.modules.integration.salesinvoice.dto.response.SalesInvoiceStockOutResponse;
import com.erp.inventory.modules.integration.salesinvoice.service.SalesInvoiceIntegrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/inventory/integration/sales-invoice")
@RequiredArgsConstructor
public class SalesInvoiceIntegrationController {

    private final SalesInvoiceIntegrationService salesInvoiceIntegrationService;

    @PostMapping("/stock-out")
    public ResponseEntity<ApiResponse<SalesInvoiceStockOutResponse>> createStockOut(
            @Valid @RequestBody SalesInvoiceStockOutRequest request) {
        
        log.info("Received Sales Invoice Stock Out Request: {}", request);
        
        try {
            SalesInvoiceStockOutResponse response = salesInvoiceIntegrationService.createStockOut(request);
            
            return ResponseEntity.ok(
                    ApiResponse.<SalesInvoiceStockOutResponse>builder()
                            .success(true)
                            .message("Sales invoice stock issued successfully")
                            .data(response)
                            .build()
            );
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            String causeMsg = e.getCause() != null && e.getCause().getMessage() != null ? e.getCause().getMessage() : "";
            
            if (msg.contains("uk_stock_movement_idempotency") || causeMsg.contains("uk_stock_movement_idempotency")) {
                log.warn("Concurrent duplicate request detected for idempotencyKey: {}. Returning existing record.", request.getIdempotencyKey());
                SalesInvoiceStockOutResponse response = salesInvoiceIntegrationService.getExistingStockOut(request.getCompanyId(), request.getIdempotencyKey(), request);
                return ResponseEntity.ok(
                        ApiResponse.<SalesInvoiceStockOutResponse>builder()
                                .success(true)
                                .message("Sales invoice stock issued successfully (Idempotent response)")
                                .data(response)
                                .build()
                );
            }
            throw e;
        }
    }
}
