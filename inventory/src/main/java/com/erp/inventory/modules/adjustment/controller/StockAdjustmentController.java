package com.erp.inventory.modules.adjustment.controller;

import com.erp.inventory.common.dto.response.ApiResponse;
import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentRequest;
import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentFilterRequest;
import com.erp.inventory.modules.adjustment.dto.response.StockAdjustmentResponse;
import com.erp.inventory.modules.adjustment.service.StockAdjustmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import com.erp.inventory.common.dto.request.ApiRequest;

@RestController
@RequestMapping("/api/inventory/stock-adjustments")
@RequiredArgsConstructor
public class StockAdjustmentController {

    private final StockAdjustmentService service;

    @PostMapping
    public ResponseEntity<ApiResponse<StockAdjustmentResponse>> create(
            @jakarta.validation.Valid @RequestBody ApiRequest<StockAdjustmentRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        StockAdjustmentResponse response = service.create(apiRequest.getData(), companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "StockAdjustment created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StockAdjustmentResponse>> getById(@PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        StockAdjustmentResponse response = service.getById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockAdjustmentResponse>>> getAll(StockAdjustmentFilterRequest filter,
            Pageable pageable, @RequestParam(required = false) UUID companyId) {
        Page<StockAdjustmentResponse> page = service.getAll(filter, pageable, companyId);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Fetched successfully"));
    }

    @PostMapping({"/{id}/submit-for-approval", "/{id}/submit"})
    public ResponseEntity<ApiResponse<StockAdjustmentResponse>> submitForApproval(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String comments) {
        StockAdjustmentResponse response = service.submitForApproval(id, companyId, comments);
        return ResponseEntity.ok(ApiResponse.success(response, "StockAdjustment submitted for approval successfully"));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<StockAdjustmentResponse>> approve(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        StockAdjustmentResponse response = service.approveAdjustment(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "StockAdjustment approved successfully"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<StockAdjustmentResponse>> reject(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String reason) {
        StockAdjustmentResponse response = service.rejectAdjustment(id, companyId, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "StockAdjustment rejected successfully"));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<StockAdjustmentResponse>> cancel(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        StockAdjustmentResponse response = service.cancelAdjustment(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "StockAdjustment cancelled successfully"));
    }

}
