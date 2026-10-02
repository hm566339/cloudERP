package com.erp.inventory.modules.integration.deliverychallan.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.integration.deliverychallan.dto.request.DeliveryChallanStockOutRequest;
import com.erp.inventory.modules.integration.deliverychallan.dto.response.DeliveryChallanStockOutResponse;
import com.erp.inventory.modules.integration.deliverychallan.service.DeliveryChallanIntegrationService;
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
@RequestMapping("/api/inventory/integration/delivery-challan")
@RequiredArgsConstructor
public class DeliveryChallanIntegrationController {

    private final DeliveryChallanIntegrationService deliveryChallanIntegrationService;

    @PostMapping("/stock-out")
    public ResponseEntity<ApiResponse<DeliveryChallanStockOutResponse>> createStockOut(
            @Valid @RequestBody DeliveryChallanStockOutRequest request) {

        log.info("Received Delivery Challan Stock Out Request: {}", request);

        try {
            DeliveryChallanStockOutResponse response = deliveryChallanIntegrationService.createStockOut(request);

            return ResponseEntity.ok(
                    ApiResponse.<DeliveryChallanStockOutResponse>builder()
                            .success(true)
                            .message("Delivery challan stock issued successfully")
                            .data(response)
                            .build()
            );
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            String causeMsg = e.getCause() != null && e.getCause().getMessage() != null ? e.getCause().getMessage() : "";

            if (msg.contains("uk_stock_movement_idempotency") || causeMsg.contains("uk_stock_movement_idempotency")) {
                log.warn("Concurrent duplicate request detected for idempotencyKey: {}. Returning existing record.", request.getIdempotencyKey());
                DeliveryChallanStockOutResponse response = deliveryChallanIntegrationService.getExistingStockOut(
                        request.getCompanyId(), request.getIdempotencyKey(), request);
                return ResponseEntity.ok(
                        ApiResponse.<DeliveryChallanStockOutResponse>builder()
                                .success(true)
                                .message("Delivery challan stock issued successfully (Idempotent response)")
                                .data(response)
                                .build()
                );
            }
            throw e;
        }
    }
}
