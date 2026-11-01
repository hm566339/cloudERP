package com.erp.account.modules.deliverychallan.controller;

import com.erp.account.common.dto.request.ApiRequest;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.BadRequestException;
import com.erp.account.modules.deliverychallan.dto.request.DcConversionRequest;
import com.erp.account.modules.deliverychallan.dto.request.DcFromReceiptRequest;
import com.erp.account.modules.deliverychallan.dto.request.DeliveryChallanUpdateRequest;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanProfileResponse;
import com.erp.account.modules.deliverychallan.dto.response.DeliveryChallanResponse;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import com.erp.account.modules.deliverychallan.service.DeliveryChallanService;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping({"/api/account/v1/delivery-challans", "/api/account/sales/delivery-challans"})
@RequiredArgsConstructor
@Tag(name = "Delivery Challan API", description = "Endpoints for managing Delivery Challans")
public class DeliveryChallanController {

    private final DeliveryChallanService deliveryChallanService;

    @Operation(summary = "Get all Delivery Challans", description = "Retrieve a paginated and filtered list of Delivery Challans.")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<DeliveryChallanProfileResponse>>> getAllDeliveryChallans(
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId,
            @Parameter(description = "Delivery Challan Status") @RequestParam(required = false) DeliveryChallanStatus status,
            @Parameter(description = "Customer ID") @RequestParam(required = false) UUID customerId,
            @Parameter(description = "From Date (YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @Parameter(description = "To Date (YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @Parameter(description = "Search by DC Number or Customer Name") @RequestParam(required = false) String search,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DeliveryChallanProfileResponse> response = deliveryChallanService.getAllDeliveryChallans(
                companyId, pageable, status, customerId, fromDate, toDate, search);
        return ResponseEntity.ok(ApiResponse.success(response, "Delivery Challans retrieved successfully"));
    }

    @Operation(summary = "Get Delivery Challan by ID", description = "Retrieve a Delivery Challan by its ID.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliveryChallanResponse>> getDeliveryChallanById(
            @Parameter(description = "Delivery Challan ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {
        DeliveryChallanResponse response = deliveryChallanService.getDeliveryChallanById(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Delivery Challan retrieved successfully"));
    }

    @Operation(summary = "Create Delivery Challan from Sales Order", description = "Creates a new Delivery Challan from a CONFIRMED Sales Order.")
    @PostMapping("/from-sales-order")
    public ResponseEntity<ApiResponse<DeliveryChallanResponse>> createFromSalesOrder(
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody ApiRequest<DcConversionRequest> request) {
        if (request == null || request.getData() == null) {
            throw new BadRequestException("Request body and data cannot be null");
        }
        DeliveryChallanResponse response = deliveryChallanService.createFromSalesOrder(companyId, request.getData());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Delivery Challan created successfully"));
    }

    @Operation(summary = "Create Delivery Challan from Receipt Voucher", description = "Creates a new Delivery Challan in DRAFT status from a Receipt Voucher linked to a Sales Invoice.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Delivery Challan created successfully in DRAFT status.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request, receipt status, or over-dispatch.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Receipt Voucher or Sales Invoice not found.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Concurrent modification conflict on Sales Invoice.")
    @PostMapping("/from-receipt/{receiptId}")
    public ResponseEntity<ApiResponse<DeliveryChallanResponse>> createFromReceipt(
            @Parameter(description = "Receipt Voucher ID", required = true) @PathVariable UUID receiptId,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody DcFromReceiptRequest request) {
        if (request == null) {
            throw new BadRequestException("Request body cannot be null");
        }
        DeliveryChallanResponse response = deliveryChallanService.createFromReceipt(companyId, receiptId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Delivery Challan created successfully from Receipt Voucher"));
    }

    @Operation(summary = "Update Delivery Challan", description = "Update editable fields of a DRAFT Delivery Challan. Recalculates totals if line items are updated.")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DeliveryChallanResponse>> updateDeliveryChallan(
            @Parameter(description = "Delivery Challan ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody ApiRequest<DeliveryChallanUpdateRequest> request) {
        DeliveryChallanResponse response = deliveryChallanService.updateDeliveryChallan(companyId, id,
                request.getData());
        return ResponseEntity.ok(ApiResponse.success(response, "Delivery Challan updated successfully"));
    }

    @Operation(summary = "Submit Delivery Challan for approval", description = "Submits a Delivery Challan to the workflow engine.")
    @PostMapping({"/{id}/submit-approval", "/{id}/submit"})
    public ResponseEntity<ApiResponse<DeliveryChallanResponse>> submitForApproval(
            @Parameter(description = "Delivery Challan ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String comments) {
        DeliveryChallanResponse response = deliveryChallanService.submitForApproval(companyId, id, comments);
        return ResponseEntity.ok(ApiResponse.success(response, "Delivery Challan submitted for approval"));
    }

    @Operation(summary = "Approve Delivery Challan", description = "Approves a Delivery Challan.")
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveDeliveryChallan(
            @Parameter(description = "Delivery Challan ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {
        deliveryChallanService.approveDeliveryChallan(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Delivery Challan approved successfully"));
    }

    @Operation(summary = "Confirm Delivery Challan", description = "Transitions a Delivery Challan from DRAFT to CONFIRMED status.")
    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmDeliveryChallan(
            @Parameter(description = "Delivery Challan ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {
        deliveryChallanService.confirmDeliveryChallan(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Delivery Challan confirmed successfully"));
    }

    @Operation(summary = "Cancel Delivery Challan", description = "Cancels a Delivery Challan.")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Void>> cancelDeliveryChallan(
            @Parameter(description = "Delivery Challan ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {
        deliveryChallanService.cancelDeliveryChallan(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Delivery Challan cancelled successfully"));
    }

    @Operation(summary = "Generate Invoice from Delivery Challan", description = "Generates a Sales Invoice directly from a CONFIRMED Delivery Challan.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Return the newly created Sales Invoice details.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Delivery Challan is not CONFIRMED or invoice already exists")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Delivery Challan not found")
    @PostMapping("/{deliveryChallanId}/generate-invoice")
    public ResponseEntity<ApiResponse<SalesInvoiceResponse>> generateInvoiceFromDeliveryChallan(
            @Parameter(description = "Delivery Challan ID", required = true) @PathVariable UUID deliveryChallanId,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {
        SalesInvoiceResponse response = deliveryChallanService.generateInvoiceFromDeliveryChallan(companyId, deliveryChallanId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Invoice generated successfully from Delivery Challan"));
    }
}
