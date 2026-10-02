package com.erp.account.modules.purchaserequisition.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.purchaserequisition.dto.*;
import com.erp.account.modules.purchaserequisition.service.PurchaseRequisitionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/purchase-requisitions")
@RequiredArgsConstructor
public class PurchaseRequisitionController {
    private final PurchaseRequisitionService service;

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponse>> create(
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<PurchaseRequisitionRequest> wrapper) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse
                .success(service.create(companyId, wrapper.unwrap()), "Purchase Requisition created successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PurchaseRequisitionResponse>>> list(
            @RequestParam(required = false) UUID companyId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(
                ApiResponse.success(service.list(companyId, pageable), "Purchase Requisitions retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponse>> get(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        return ResponseEntity
                .ok(ApiResponse.success(service.get(companyId, id), "Purchase Requisition retrieved successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponse>> update(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<PurchaseRequisitionRequest> wrapper) {
        return ResponseEntity.ok(ApiResponse.success(service.update(companyId, id, wrapper.unwrap()),
                "Purchase Requisition updated successfully"));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponse>> submit(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(service.submit(companyId, id), "Purchase Requisition submitted"));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponse>> approve(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(service.approve(companyId, id), "Purchase Requisition approved"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponse>> reject(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId, @RequestBody(required = false) Map<String, String> body) {
        return ResponseEntity
                .ok(ApiResponse.success(service.reject(companyId, id, body == null ? null : body.get("reason")),
                        "Purchase Requisition rejected"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<PurchaseRequisitionResponse>> cancel(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(service.cancel(companyId, id), "Purchase Requisition cancelled"));
    }
}
