package com.erp.account.modules.purchasereturn.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.purchasereturn.dto.PurchaseReturnRequest;
import com.erp.account.modules.purchasereturn.dto.PurchaseReturnResponse;
import com.erp.account.modules.purchasereturn.service.PurchaseReturnService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/account/purchase-returns")
@RequiredArgsConstructor
@Tag(name = "Purchase Return API", description = "Endpoints for managing Purchase Returns against Goods Receipts")
public class PurchaseReturnController {

    private final PurchaseReturnService purchaseReturnService;

    @Operation(summary = "Create Purchase Return", description = "Create a draft Purchase Return against an accepted Goods Receipt")
    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseReturnResponse>> createPurchaseReturn(
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<PurchaseReturnRequest> requestWrapper) {
        log.info("POST /api/account/purchase-returns - Creating purchase return");
        PurchaseReturnResponse response = purchaseReturnService.createPurchaseReturn(companyId, requestWrapper.unwrap());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Purchase Return created successfully"));
    }

    @Operation(summary = "Confirm Purchase Return", description = "Confirm a draft Purchase Return and trigger inventory deduction")
    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<PurchaseReturnResponse>> confirmPurchaseReturn(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        log.info("POST /api/account/purchase-returns/{}/confirm - Confirming purchase return", id);
        PurchaseReturnResponse response = purchaseReturnService.confirmPurchaseReturn(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Return confirmed successfully"));
    }

    @Operation(summary = "Get Purchase Return by ID", description = "Retrieve a Purchase Return with its line items")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseReturnResponse>> getPurchaseReturnById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        PurchaseReturnResponse response = purchaseReturnService.getPurchaseReturnById(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Return retrieved successfully"));
    }

    @Operation(summary = "List Purchase Returns", description = "Get paginated list of Purchase Returns")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PurchaseReturnResponse>>> getAllPurchaseReturns(
            @RequestParam(required = false) UUID companyId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PurchaseReturnResponse> page = purchaseReturnService.getAllPurchaseReturns(companyId, pageable);
        return ResponseEntity.ok(ApiResponse.success(page, "Purchase Returns retrieved successfully"));
    }

    @Operation(summary = "Cancel Purchase Return",
            description = "Cancel a DRAFT or CONFIRMED Purchase Return. "
                    + "If CONFIRMED, reverses returned quantities on the GRN and cancels any pending inventory outbox task.")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<PurchaseReturnResponse>> cancelPurchaseReturn(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String reason) {
        log.info("POST /api/account/purchase-returns/{}/cancel - Cancelling purchase return", id);
        PurchaseReturnResponse response = purchaseReturnService.cancelPurchaseReturn(companyId, id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Return cancelled successfully"));
    }

    @Operation(summary = "Get Returns for Goods Receipt", description = "List all Purchase Returns for a Goods Receipt")
    @GetMapping("/by-goods-receipt/{grnId}")
    public ResponseEntity<ApiResponse<List<PurchaseReturnResponse>>> getPurchaseReturnsByGoodsReceipt(
            @PathVariable UUID grnId,
            @RequestParam(required = false) UUID companyId) {
        List<PurchaseReturnResponse> list = purchaseReturnService.getPurchaseReturnsByGoodsReceiptId(companyId, grnId);
        return ResponseEntity.ok(ApiResponse.success(list, "Purchase Returns retrieved for Goods Receipt"));
    }
}
