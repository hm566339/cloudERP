package com.erp.inventory.modules.integration.purchaseinvoice.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.request.PurchaseInvoiceStockInRequest;
import com.erp.inventory.modules.integration.purchaseinvoice.dto.response.PurchaseInvoiceStockInResponse;
import com.erp.inventory.modules.integration.purchaseinvoice.service.PurchaseInvoiceIntegrationService;
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
@RequestMapping("/api/inventory/integration/purchase-invoice")
@RequiredArgsConstructor
public class PurchaseInvoiceIntegrationController {

    private final PurchaseInvoiceIntegrationService purchaseInvoiceIntegrationService;

    @PostMapping("/stock-in")
    public ResponseEntity<ApiResponse<PurchaseInvoiceStockInResponse>> createStockIn(
            @Valid @RequestBody PurchaseInvoiceStockInRequest request) {
        
        log.info("Received Purchase Invoice Stock In Request: {}", request);
        
        try {
            PurchaseInvoiceStockInResponse response = purchaseInvoiceIntegrationService.createStockIn(request);
            
            return ResponseEntity.ok(
                    ApiResponse.<PurchaseInvoiceStockInResponse>builder()
                            .success(true)
                            .message("Purchase invoice stock-in processed successfully")
                            .data(response)
                            .build()
            );
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            String causeMsg = e.getCause() != null && e.getCause().getMessage() != null ? e.getCause().getMessage() : "";
            
            if (msg.contains("uk_stock_movement_idempotency") || causeMsg.contains("uk_stock_movement_idempotency")) {
                log.warn("Concurrent duplicate request detected for idempotencyKey: {}. Returning existing record.", request.getIdempotencyKey());
                PurchaseInvoiceStockInResponse response = purchaseInvoiceIntegrationService.getExistingStockIn(request.getCompanyId(), request.getIdempotencyKey(), request);
                return ResponseEntity.ok(
                        ApiResponse.<PurchaseInvoiceStockInResponse>builder()
                                .success(true)
                                .message("Purchase invoice stock-in already processed (Idempotent response)")
                                .data(response)
                                .build()
                );
            }
            throw e;
        }
    }
}
