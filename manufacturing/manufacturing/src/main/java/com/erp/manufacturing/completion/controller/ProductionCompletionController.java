package com.erp.manufacturing.completion.controller;

import com.erp.manufacturing.completion.dto.ProductionCompletionRequest;
import com.erp.manufacturing.completion.dto.ProductionCompletionResponse;
import com.erp.manufacturing.completion.service.ProductionCompletionService;
import com.erp.manufacturing.util.TenantUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/manufacturing/production-orders")
@RequiredArgsConstructor
public class ProductionCompletionController {
    private final ProductionCompletionService service;

    @PostMapping("/{productionOrderId}/complete")
    public ResponseEntity<ProductionCompletionResponse> complete(
            @PathVariable UUID productionOrderId,
            @Valid @RequestBody ProductionCompletionRequest request) {
        return ResponseEntity.ok(service.complete(productionOrderId, request, TenantUtils.getCurrentCompanyId()));
    }
}