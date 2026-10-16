package com.erp.account.modules.purchaseorder.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.paymentvoucher.dto.response.PaymentVoucherResponse;
import com.erp.account.modules.purchaseorder.dto.POAdvanceRequest;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderFilterDto;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderRequest;
import com.erp.account.modules.purchaseorder.dto.PurchaseOrderResponse;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.purchaseorder.service.PurchaseOrderService;
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
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/account/purchase-orders")
@RequiredArgsConstructor
@Tag(name = "Purchase Order API", description = "Endpoints for managing Purchase Orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @Operation(summary = "Create Purchase Order", description = "Creates a new purchase order in DRAFT status")
    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> createPurchaseOrder(
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<PurchaseOrderRequest> requestWrapper) {
        log.info("POST /api/account/purchase-orders - Creating purchase order");
        PurchaseOrderResponse response = purchaseOrderService.createPurchaseOrder(companyId, requestWrapper.unwrap());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Purchase Order created successfully"));
    }

    @Operation(summary = "Create Purchase Order from Supplier Quotation")
    @PostMapping("/from-supplier-quotation/{quotationId}")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> createFromSupplierQuotation(
            @PathVariable UUID quotationId,
            @RequestParam(required = false) UUID companyId) {
        PurchaseOrderResponse response = purchaseOrderService.createFromSupplierQuotation(companyId, quotationId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Purchase Order created from supplier quotation"));
    }

    @Operation(summary = "Get all Purchase Orders", description = "Retrieve a paginated and filtered list of Purchase Orders")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<PurchaseOrderResponse>>> getAllPurchaseOrders(
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) PurchaseOrderStatus status,
            @RequestParam(required = false) UUID vendorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String search,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PurchaseOrderFilterDto filter = PurchaseOrderFilterDto.builder()
                .status(status)
                .vendorId(vendorId)
                .fromDate(fromDate)
                .toDate(toDate)
                .search(search)
                .build();
        Page<PurchaseOrderResponse> page = purchaseOrderService.getAllPurchaseOrders(companyId, pageable, filter);
        return ResponseEntity.ok(ApiResponse.success(page, "Purchase Orders retrieved successfully"));
    }

    @Operation(summary = "Get Purchase Order by ID", description = "Retrieve a Purchase Order and its items by ID")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getPurchaseOrderById(
            @Parameter(description = "Purchase Order ID", required = true) @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        PurchaseOrderResponse response = purchaseOrderService.getPurchaseOrderById(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Order retrieved successfully"));
    }

    @Operation(summary = "Update Purchase Order", description = "Update an existing DRAFT Purchase Order")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> updatePurchaseOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<PurchaseOrderRequest> requestWrapper) {
        PurchaseOrderResponse response = purchaseOrderService.updatePurchaseOrder(companyId, id,
                requestWrapper.unwrap());
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Order updated successfully"));
    }

    @Operation(summary = "Submit Purchase Order for Approval", description = "Transition status from DRAFT to PENDING_APPROVAL and initiate workflow")
    @PostMapping({"/{id}/submit", "/{id}/submit-approval"})
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> submitForApproval(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @RequestBody(required = false) Map<String, String> body) {
        String comments = body != null ? body.get("comments") : null;
        PurchaseOrderResponse response = purchaseOrderService.submitForApproval(companyId, id, comments);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Order submitted for approval"));
    }

    @Operation(summary = "Approve Purchase Order", description = "Approve a PENDING_APPROVAL Purchase Order")
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> approvePurchaseOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        PurchaseOrderResponse response = purchaseOrderService.approvePurchaseOrder(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Order approved successfully"));
    }

    @Operation(summary = "Reject Purchase Order", description = "Reject a PENDING_APPROVAL Purchase Order")
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> rejectPurchaseOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        PurchaseOrderResponse response = purchaseOrderService.rejectPurchaseOrder(companyId, id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Order rejected"));
    }

    @Operation(summary = "Manual Status Override", description = "Manually overrides the status of a Purchase Order.")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> overrideStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody com.erp.account.modules.purchaseorder.dto.PurchaseOrderStatusOverrideRequest request) {
        PurchaseOrderResponse response = purchaseOrderService.overrideStatus(companyId, id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Order status updated successfully"));
    }

    @Operation(summary = "Update Advance Requirement", description = "Configure whether advance payment is required for this PO")
    @PatchMapping("/{id}/advance-requirement")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> updateAdvanceRequirement(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<com.erp.account.modules.purchaseorder.dto.PurchaseOrderAdvanceRequirementRequest> requestWrapper) {
        PurchaseOrderResponse response = purchaseOrderService.updateAdvanceRequirement(companyId, id,
                requestWrapper.unwrap());
        return ResponseEntity.ok(ApiResponse.success(response, "Advance payment requirement updated successfully."));
    }

    @Operation(summary = "Mark Purchase Order as Sent", description = "Transition status from APPROVED to SENT")
    @PostMapping("/{id}/send")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> sendPurchaseOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        PurchaseOrderResponse response = purchaseOrderService.sendPurchaseOrder(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Order marked as SENT"));
    }

    @Operation(summary = "Cancel Purchase Order", description = "Cancel a Purchase Order (only allowed if no items have been received)")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> cancelPurchaseOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        PurchaseOrderResponse response = purchaseOrderService.cancelPurchaseOrder(companyId, id, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Order cancelled"));
    }

    @Operation(summary = "Close Purchase Order", description = "Close a fully received or partially received Purchase Order")
    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> closePurchaseOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        PurchaseOrderResponse response = purchaseOrderService.closePurchaseOrder(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Purchase Order closed"));
    }

    @Operation(summary = "Create advance payment", description = "Creates a supplier advance payment against a Purchase Order")
    @PostMapping("/{id}/advance-payment")
    public ResponseEntity<ApiResponse<PaymentVoucherResponse>> createAdvancePayment(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<POAdvanceRequest> requestWrapper) {
        PaymentVoucherResponse response = purchaseOrderService
                .createAdvancePayment(companyId, id, requestWrapper.unwrap());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Advance payment created successfully"));
    }

    @Operation(summary = "Delete Purchase Order", description = "Soft delete a DRAFT Purchase Order")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePurchaseOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        purchaseOrderService.deletePurchaseOrder(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Purchase Order deleted successfully"));
    }
}
