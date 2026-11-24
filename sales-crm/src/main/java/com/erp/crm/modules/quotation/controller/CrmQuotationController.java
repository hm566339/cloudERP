package com.erp.crm.modules.quotation.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.quotation.dto.request.QuotationCreateRequest;
import com.erp.crm.modules.quotation.dto.response.ConvertToSalesOrderResponse;
import com.erp.crm.modules.quotation.dto.response.QuotationResponse;
import com.erp.crm.modules.quotation.service.CrmQuotationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm/quotations")
@RequiredArgsConstructor
@Tag(name = "Quotation Management", description = "Endpoints for Quotations, Statutory GST Calculation, Approvals & Conversion to Orders")
public class CrmQuotationController {

    private final CrmQuotationService quotationService;

    @PostMapping
    @Operation(summary = "Create Quotation with Multi-Line GST & Discount Evaluation")
    public ResponseEntity<ApiResponse<QuotationResponse>> createQuotation(
            @RequestBody @Valid ApiRequest<QuotationCreateRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        QuotationResponse response = quotationService.createQuotation(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Quotation created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Quotation Details by ID")
    public ResponseEntity<ApiResponse<QuotationResponse>> getQuotationById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        QuotationResponse response = quotationService.getQuotationById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "List Quotations (Paginated)")
    public ResponseEntity<ApiResponse<List<QuotationResponse>>> getAllQuotations(
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        Page<QuotationResponse> page = quotationService.getAllQuotations(companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Quotations fetched successfully"));
    }

    @PostMapping("/{id}/submit-approval")
    @Operation(summary = "Submit Quotation for Workflow Approval")
    public ResponseEntity<ApiResponse<QuotationResponse>> submitForApproval(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        QuotationResponse response = quotationService.submitForApproval(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Quotation submitted for approval"));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve Quotation Directly (Manager / Finance Approval)")
    public ResponseEntity<ApiResponse<QuotationResponse>> approveQuotation(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        QuotationResponse response = quotationService.approveQuotation(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Quotation approved successfully"));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject Quotation")
    public ResponseEntity<ApiResponse<QuotationResponse>> rejectQuotation(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String reason) {
        QuotationResponse response = quotationService.rejectQuotation(id, companyId, reason);
        return ResponseEntity.ok(ApiResponse.success(response, "Quotation rejected"));
    }

    @PostMapping("/{id}/convert-to-sales-order")
    @Operation(summary = "Convert Accepted Quotation to ERP Sales Order")
    public ResponseEntity<ApiResponse<ConvertToSalesOrderResponse>> convertToSalesOrder(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        ConvertToSalesOrderResponse response = quotationService.convertToSalesOrder(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Quotation converted to sales order successfully"));
    }
}

