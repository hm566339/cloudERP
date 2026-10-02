package com.erp.account.modules.salesorder.controller;

import com.erp.account.common.dto.request.ApiRequest;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse;
import com.erp.account.modules.salesorder.dto.request.SOConversionRequest;
import com.erp.account.modules.salesorder.dto.response.SalesOrderResponse;
import com.erp.account.modules.salesorder.dto.response.profile.SalesOrderProfileResponse;
import com.erp.account.modules.salesorder.service.SalesOrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import com.erp.account.modules.salesorder.dto.request.SalesOrderUpdateRequest;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
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
@RequestMapping("/api/account/v1/sales-orders")
@RequiredArgsConstructor
@Tag(name = "Sales Order API", description = "Sales Order management with support for both:\n1. Proforma Invoice → Sales Order\n2. Direct ACCEPTED Quotation → Sales Order for eligible customers")
public class SalesOrderController {

    private final SalesOrderService salesOrderService;

    @Operation(summary = "Create Sales Order from PI", description = "Create a Sales Order from a CONFIRMED Proforma Invoice.\n\nOnly CONFIRMED Proforma Invoices can be converted.\n\nThis endpoint supports partial quantity conversion.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Return the complete Sales Order response.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "PI is not CONFIRMED / Invalid PI item / Invalid quantity / Requested quantity exceeds available quantity / Sales Order conversion is not allowed")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "PI not found")
    @PostMapping("/from-proforma-invoice/{piId}")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> createFromProformaInvoice(
            @Parameter(description = "Proforma Invoice ID", required = true) @PathVariable UUID piId,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody ApiRequest<SOConversionRequest> request) {
        SalesOrderResponse response = salesOrderService.createFromProformaInvoice(companyId, piId, request.getData());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sales Order created successfully from Proforma Invoice"));
    }

    @Operation(summary = "Create Direct Sales Order from Quotation", description = "Create a Sales Order directly from an ACCEPTED Quotation without creating a Proforma Invoice.\n\nOnly ACCEPTED Quotations can be converted.\n\nThe customer must have at least one previous valid and fully paid Sales Invoice.\n\nBusiness rules:\n- quotation must exist\n- quotation must be ACCEPTED\n- quotation must not be deleted/cancelled\n- customer must have at least one qualifying fully paid Sales Invoice\n- quotation must not already have an active Sales Order\n- Proforma Invoice is NOT required for this conversion\n- resulting Sales Order status is DRAFT\n- sourceQuotationId must be populated\n- sourceProformaInvoiceId must be null for this flow")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Return the complete Sales Order response.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Quotation is not ACCEPTED / Customer does not have a fully paid previous Sales Invoice / Sales Order already exists for quotation")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Quotation not found")
    @PostMapping("/from-quotation/{quotationId}")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> createDirectFromQuotation(
            @Parameter(description = "Quotation ID", required = true) @PathVariable UUID quotationId,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {
        SalesOrderResponse response = salesOrderService.createDirectFromQuotation(companyId, quotationId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sales Order created successfully from quotation"));
    }

    @Operation(summary = "Get Complete Sales Order by ID", description = "Retrieve complete Sales Order details by ID, including relational customer details, billing & delivery addresses, line items with product and tax breakdowns, commercial terms, and snapshot values. Essential for the Create Invoice From Order flow.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Complete Sales Order with relational data retrieved successfully")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid UUID format or validation error")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Sales Order not found or does not belong to specified company")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SalesOrderProfileResponse>> getSalesOrderById(
            @Parameter(description = "Sales Order ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {
        SalesOrderProfileResponse response = salesOrderService.getSalesOrderById(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales Order retrieved successfully"));
    }

    @Operation(summary = "Confirm Sales Order", description = "Confirm a DRAFT Sales Order.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Return the complete Sales Order response.")
    @PostMapping("/{id}/confirm")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> confirmSO(
            @Parameter(description = "Sales Order ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {
        SalesOrderResponse response = salesOrderService.confirmSO(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales Order confirmed successfully"));
    }

    @Operation(summary = "Cancel Sales Order", description = "Cancel an existing Sales Order according to the existing Sales Order cancellation rules.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Return the complete Sales Order response.")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> cancelSO(
            @Parameter(description = "Sales Order ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {
        SalesOrderResponse response = salesOrderService.cancelSO(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales Order cancelled successfully"));
    }

    @Operation(summary = "Get All Sales Orders", description = "Retrieve a paginated and filtered list of Sales Orders.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Paginated list of Sales Orders")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<SalesOrderResponse>>> getAllSalesOrders(
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId,
            @Parameter(description = "Sales Order Status") @RequestParam(required = false) SalesOrderStatus status,
            @Parameter(description = "Customer ID") @RequestParam(required = false) UUID customerId,
            @Parameter(description = "From Date (YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @Parameter(description = "To Date (YYYY-MM-DD)") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @Parameter(description = "Search by SO Number or Customer Name") @RequestParam(required = false) String search,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SalesOrderResponse> response = salesOrderService.getAllSalesOrders(companyId, pageable, status, customerId,
                fromDate, toDate, search);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales Orders retrieved successfully"));
    }

    @Operation(summary = "Update Sales Order", description = "Update editable fields of a DRAFT Sales Order. Recalculates totals if line items are updated.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Return the updated Sales Order response.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Sales Order is not in DRAFT status or invalid request")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SalesOrderResponse>> updateSalesOrder(
            @Parameter(description = "Sales Order ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody ApiRequest<SalesOrderUpdateRequest> request) {
        SalesOrderResponse response = salesOrderService.updateSalesOrder(companyId, id, request.getData());
        return ResponseEntity.ok(ApiResponse.success(response, "Sales Order updated successfully"));
    }

    @Operation(summary = "Generate Invoice from Sales Order", description = "Generate a Sales Invoice directly from an existing Sales Order.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Return the newly created Sales Invoice details.")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Sales Order not found")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Invoice already exists for this Sales Order")
    @PostMapping("/{salesOrderId}/generate-invoice")
    public ResponseEntity<ApiResponse<SalesInvoiceResponse>> generateInvoiceFromSalesOrder(
            @Parameter(description = "Sales Order ID", required = true) @PathVariable UUID salesOrderId,
            @Parameter(description = "Company ID") @RequestParam(required = false) UUID companyId) {
        SalesInvoiceResponse response = salesOrderService.generateInvoiceFromSalesOrder(companyId, salesOrderId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Invoice generated successfully"));
    }
}
