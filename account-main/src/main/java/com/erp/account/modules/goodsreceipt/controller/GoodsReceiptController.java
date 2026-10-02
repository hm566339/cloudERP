package com.erp.account.modules.goodsreceipt.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptFilterDto;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptRequest;
import com.erp.account.modules.goodsreceipt.dto.GoodsReceiptResponse;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import com.erp.account.modules.goodsreceipt.service.GoodsReceiptService;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/account/goods-receipts")
@RequiredArgsConstructor
@Tag(name = "Goods Receipt (GRN) API", description = "Endpoints for managing Goods Receipts / GRN")
public class GoodsReceiptController {

    private final GoodsReceiptService goodsReceiptService;

    @Operation(summary = "Create Goods Receipt from Purchase Order", description = "Creates a new DRAFT Goods Receipt for an approved/sent Purchase Order")
    @PostMapping("/from-po/{poId}")
    public ResponseEntity<ApiResponse<GoodsReceiptResponse>> createFromPurchaseOrder(
            @PathVariable UUID poId,
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<GoodsReceiptRequest> requestWrapper) {
        log.info("POST /api/account/goods-receipts/from-po/{} - Creating GRN", poId);
        GoodsReceiptResponse response = goodsReceiptService.createFromPurchaseOrder(companyId, poId, requestWrapper.unwrap());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Goods Receipt created successfully"));
    }

    @Operation(summary = "Get all Goods Receipts", description = "Retrieve a paginated and filtered list of Goods Receipts")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<GoodsReceiptResponse>>> getAllGoodsReceipts(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) GoodsReceiptStatus status,
            @RequestParam(required = false) UUID purchaseOrderId,
            @RequestParam(required = false) UUID vendorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String search,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        GoodsReceiptFilterDto filter = GoodsReceiptFilterDto.builder()
                .status(status)
                .purchaseOrderId(purchaseOrderId)
                .vendorId(vendorId)
                .fromDate(fromDate)
                .toDate(toDate)
                .search(search)
                .build();
        Page<GoodsReceiptResponse> page = goodsReceiptService.getAllGoodsReceipts(companyId, pageable, filter);
        return ResponseEntity.ok(ApiResponse.success(page, "Goods Receipts retrieved successfully"));
    }

    @Operation(summary = "Get Goods Receipt by ID", description = "Retrieve a Goods Receipt and its items by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GoodsReceiptResponse>> getGoodsReceiptById(
            @Parameter(description = "Goods Receipt ID", required = true) @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        GoodsReceiptResponse response = goodsReceiptService.getGoodsReceiptById(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Goods Receipt retrieved successfully"));
    }

    @Operation(summary = "Update Goods Receipt", description = "Update an existing DRAFT Goods Receipt")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GoodsReceiptResponse>> updateGoodsReceipt(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<GoodsReceiptRequest> requestWrapper) {
        GoodsReceiptResponse response = goodsReceiptService.updateGoodsReceipt(companyId, id, requestWrapper.unwrap());
        return ResponseEntity.ok(ApiResponse.success(response, "Goods Receipt updated successfully"));
    }

    @Operation(summary = "Verify Goods Receipt", description = "Verify physical goods on DRAFT Goods Receipt without moving stock or PO quantities")
    @PostMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<GoodsReceiptResponse>> verifyGoodsReceipt(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        log.info("POST /api/account/goods-receipts/{}/verify - Verifying GRN", id);
        GoodsReceiptResponse response = goodsReceiptService.verifyGoodsReceipt(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Goods Receipt verified successfully"));
    }

    @Operation(summary = "Post Goods Receipt", description = "Post verified Goods Receipt, update Purchase Order quantities, and trigger Inventory Stock-In")
    @PostMapping("/{id}/post")
    public ResponseEntity<ApiResponse<GoodsReceiptResponse>> postGoodsReceipt(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        log.info("POST /api/account/goods-receipts/{}/post - Posting GRN", id);
        GoodsReceiptResponse response = goodsReceiptService.postGoodsReceipt(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Goods Receipt posted and inventory stock-in scheduled successfully"));
    }

    @Operation(summary = "Confirm Goods Receipt", description = "Backward compatible endpoint to verify and post Goods Receipt")
    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<GoodsReceiptResponse>> confirmGoodsReceipt(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        log.info("POST /api/account/goods-receipts/{}/confirm - Confirming GRN", id);
        GoodsReceiptResponse response = goodsReceiptService.confirmGoodsReceipt(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Goods Receipt confirmed and inventory stock-in scheduled successfully"));
    }

    @Operation(summary = "Get Pending Receipts by Warehouse", description = "Retrieve approved POs with items pending receipt for a specific warehouse")
    @GetMapping("/pending-by-warehouse/{warehouseId}")
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> getPendingByWarehouse(
            @PathVariable UUID warehouseId,
            @RequestParam(required = false) UUID companyId) {
        List<PurchaseOrderResponse> list = goodsReceiptService.getPendingReceiptsByWarehouse(companyId, warehouseId);
        return ResponseEntity.ok(ApiResponse.success(list, "Pending warehouse receipts retrieved successfully"));
    }

    @Operation(summary = "Cancel Goods Receipt", description = "Cancel a DRAFT Goods Receipt")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<GoodsReceiptResponse>> cancelGoodsReceipt(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        GoodsReceiptResponse response = goodsReceiptService.cancelGoodsReceipt(companyId, id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Goods Receipt cancelled"));
    }

    @Operation(summary = "Reverse Confirmed Goods Receipt", description = "Safely reverse a CONFIRMED Goods Receipt, reverting PO quantities and scheduling inventory stock-out")
    @PostMapping("/{id}/reverse")
    public ResponseEntity<ApiResponse<GoodsReceiptResponse>> reverseGoodsReceipt(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : "Goods Receipt reversed";
        GoodsReceiptResponse response = goodsReceiptService.reverseGoodsReceipt(companyId, id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Goods Receipt reversed successfully"));
    }

    @Operation(summary = "Get Goods Receipts for Purchase Order", description = "List all Goods Receipts linked to a specific Purchase Order")
    @GetMapping("/by-purchase-order/{poId}")
    public ResponseEntity<ApiResponse<List<GoodsReceiptResponse>>> getGoodsReceiptsByPurchaseOrder(
            @PathVariable UUID poId,
            @RequestParam(required = false) UUID companyId) {
        List<GoodsReceiptResponse> list = goodsReceiptService.getGoodsReceiptsByPurchaseOrderId(companyId, poId);
        return ResponseEntity.ok(ApiResponse.success(list, "Goods Receipts retrieved successfully for Purchase Order"));
    }

    @Operation(summary = "Delete Goods Receipt", description = "Soft delete a DRAFT Goods Receipt")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGoodsReceipt(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        goodsReceiptService.deleteGoodsReceipt(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Goods Receipt deleted successfully"));
    }
}
