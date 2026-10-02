package com.erp.account.modules.apinvoice.controller;

import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceResponse;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceProfileResponse;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceFilterDto;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceStatusUpdateRequest;
import com.erp.account.modules.apinvoice.dto.request.ApInvoicePostingStatusUpdateRequest;
import com.erp.account.util.AgingReportHelper;
import com.erp.account.util.Invoice;
import com.erp.account.util.TenantUtils;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.exception.BaseApplicationException;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.common.service.EmailService;
import com.erp.account.modules.apinvoice.service.ApInvoicePdfService;
import com.erp.account.modules.apinvoice.service.ApInvoiceService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import com.erp.account.modules.apinvoice.entity.ApInvoice;

/**
 * REST Controller for AP Invoice Management
 * 
 * Provides REST endpoints for:
 * - Invoice CRUD operations
 * - Invoice approval workflow
 * - GL posting
 * - Payment tracking
 * - Financial reporting
 * - Invoice aging analysis
 * 
 * Base path: /api/ap/invoices
 */
@Slf4j
@RestController
@RequestMapping("/api/account/invoices")
@RequiredArgsConstructor
@Tag(name = "AP Invoice Management", description = "APIs for managing Accounts Payable invoices")
public class ApInvoiceController {

    private final ApInvoiceService apInvoiceService;
    private final ApInvoicePdfService apInvoicePdfService;
    private final EmailService emailService;

    // ============================================================
    // CREATE OPERATIONS
    // ============================================================

    @PostMapping
    @Operation(summary = "Create a new AP invoice", description = "Creates a new AP invoice with line items")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Invoice created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request data"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Duplicate invoice number")
    })
    public ResponseEntity<ApiResponse<ApInvoiceResponse>> createInvoice(
            @Valid @RequestBody RequestWrapper<ApInvoiceRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        ApInvoiceRequest request = requestWrapper.unwrap();
        log.info("POST /api/account/invoices - Creating invoice for company: {}", companyId);

        ApInvoiceResponse response = apInvoiceService.createInvoice(companyId, requestWrapper);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Invoice created successfully."));
    }

    @PostMapping("/from-grn/{grnId}")
    @Operation(summary = "Create AP invoice from Goods Receipt (GRN)", description = "Generates a draft AP invoice populated from accepted GRN quantities and PO rates with recalculated taxes")
    public ResponseEntity<ApiResponse<ApInvoiceResponse>> createInvoiceFromGrn(
            @PathVariable UUID grnId,
            @RequestParam(required = false) UUID companyId) {
        log.info("POST /api/account/invoices/from-grn/{} - Creating invoice from GRN", grnId);
        ApInvoiceResponse response = apInvoiceService.createInvoiceFromGrn(companyId, grnId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Draft AP Invoice created from GRN successfully."));
    }

    // ============================================================
    // READ OPERATIONS
    // ============================================================

    @GetMapping("/{id}")
    @Operation(summary = "Get purchase invoice profile by ID", description = "Retrieves complete purchase invoice profile with vendor, item, accounting, inventory, and tax details")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Invoice profile found", content = @Content(schema = @Schema(implementation = ApInvoiceProfileResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Invoice not found")
    })
    public ResponseEntity<ApiResponse<ApInvoiceProfileResponse>> getInvoiceById(
            @Parameter(description = "Invoice ID", required = true) @PathVariable UUID id) {

        log.info("GET /api/account/invoices/{} - Retrieving invoice profile", id);

        ApInvoiceProfileResponse response = apInvoiceService.getInvoiceById(id);

        return ResponseEntity.ok(ApiResponse.success(response, "AP invoice profile retrieved successfully"));
    }

    @GetMapping(path = "/{invoiceId}/pdf")
    @Operation(summary = "Download invoice PDF", description = "Generates and downloads the purchase invoice PDF")
    public void downloadInvoicePdf(
            @PathVariable UUID invoiceId,
            @RequestParam(required = false) UUID companyId,
            HttpServletResponse response) throws java.io.IOException {
        log.info("REST: Downloading AP invoice PDF for: {}", invoiceId);

        try {
            byte[] pdfBytes = apInvoicePdfService.generateApInvoicePdf(invoiceId, companyId);

            response.setContentType(MediaType.APPLICATION_PDF_VALUE);
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"purchase-invoice-" + invoiceId + ".pdf\"");
            response.getOutputStream().write(pdfBytes);
            response.getOutputStream().flush();
        } catch (Exception ex) {
            log.error("Error generating PDF: {}", ex.getMessage());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);

            int status = HttpStatus.INTERNAL_SERVER_ERROR.value();
            String message = "An unexpected error occurred";
            String errorType = ex.getClass().getSimpleName();

            if (ex instanceof com.erp.account.common.exception.ResourceNotFoundException
                    || errorType.endsWith("NotFoundException")) {
                status = HttpStatus.NOT_FOUND.value();
                message = ex.getMessage();
            } else if (ex instanceof com.erp.account.common.exception.BaseApplicationException) {
                status = HttpStatus.BAD_REQUEST.value();
                message = ex.getMessage();
            }
            response.setStatus(status);

            String json = String.format(
                    "{\"success\":false,\"message\":\"%s\",\"status\":%d,\"data\":{\"error\":\"%s\"}}",
                    message != null ? message.replace("\"", "\\\"") : "", status, errorType);
            response.getWriter().write(json);
            response.getWriter().flush();
        }
    }

    @PostMapping("/{invoiceId}/send-email")
    @Operation(summary = "Send invoice PDF via email", description = "Generates the purchase invoice PDF and sends it to the vendor's email address")
    public ResponseEntity<ApiResponse<Void>> sendInvoiceEmail(
            @PathVariable UUID invoiceId,
            @RequestParam(required = false) UUID companyId) {
        log.info("REST: Sending AP invoice PDF via email for: {}", invoiceId);

        // Fetch the invoice profile to get vendor email and invoice details
        ApInvoiceProfileResponse profile = apInvoiceService.getInvoiceById(invoiceId);
        String vendorEmail = profile.getVendorInformation() != null ? profile.getVendorInformation().getEmail() : null;

        if (vendorEmail == null || vendorEmail.isBlank()) {
            throw new IllegalArgumentException("Vendor email address is not available");
        }

        // Generate the PDF
        byte[] pdfBytes = apInvoicePdfService.generateApInvoicePdf(invoiceId, companyId);

        // Prepare email
        String companyName = profile.getCompanyInformation() != null ? profile.getCompanyInformation().getCompanyName()
                : "Our Company";
        String vendorName = profile.getVendorInformation() != null ? profile.getVendorInformation().getVendorName()
                : "Vendor";

        String subject = "Purchase Invoice " + profile.getInvoiceNumber() + " from " + companyName;
        String body = "Dear " + vendorName + ",\n\n" +
                "Please find attached the purchase invoice " + profile.getInvoiceNumber() + " dated "
                + profile.getInvoiceDate() + ".\n\n" +
                "Total Amount: " + profile.getBaseCurrencyAmount() + "\n" +
                "Due Date: " + profile.getDueDate() + "\n\n" +
                "Thank you for your business.\n\n" +
                "Regards,\n" + companyName;

        String filename = "purchase-invoice-" + profile.getInvoiceNumber() + ".pdf";

        // Send email
        emailService.sendEmailWithPdfAttachment(vendorEmail, subject, body, pdfBytes, filename);

        return ResponseEntity.ok(ApiResponse.success(null, "Invoice email sent successfully to " + vendorEmail));
    }

    @GetMapping
    @Operation(summary = "Get all invoices", description = "Retrieves all invoices for a company with pagination and advanced filtering")
    public ResponseEntity<ApiResponse<Page<ApInvoiceResponse>>> getAllInvoices(
            @ModelAttribute ApInvoiceFilterDto filter,
            @Parameter(description = "Page number (0-indexed)", required = false) @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", required = false) @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field", required = false) @RequestParam(defaultValue = "invoiceDate") String sortBy,
            @Parameter(description = "Sort direction (ASC/DESC)", required = false) @RequestParam(defaultValue = "DESC") Sort.Direction direction) {
        log.info("GET /api/ap/invoices - Retrieving invoices for company: {} with filter: {}", filter.getCompanyId(),
                filter);

        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        Page<ApInvoiceResponse> invoices = apInvoiceService.getAllInvoices(filter.getCompanyId(), filter, pageable);

        return ResponseEntity.ok(ApiResponse.success(invoices, "AP invoices retrieved successfully"));
    }

    // ============================================================
    // UPDATE OPERATIONS
    // ============================================================

    @PutMapping("/{id}")
    @Operation(summary = "Update an invoice", description = "Updates an existing invoice (only DRAFT or PENDING_APPROVAL)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Invoice updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request or invoice not editable"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Invoice not found")
    })
    public ResponseEntity<ApiResponse<ApInvoiceResponse>> updateInvoice(
            @Parameter(description = "Invoice ID", required = true) @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ApInvoiceRequest> requestWrapper) {

        ApInvoiceRequest request = requestWrapper.unwrap();
        log.info("PUT /api/ap/invoices/{} - Updating invoice", id);

        ApInvoiceResponse response = apInvoiceService.updateInvoice(id, requestWrapper);

        return ResponseEntity.ok(ApiResponse.success(response, "AP invoice updated successfully"));
    }

    // ============================================================
    // DELETE OPERATIONS
    // ============================================================

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an invoice", description = "Deletes an invoice (only DRAFT invoices can be deleted)")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Invoice deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invoice not deletable"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Invoice not found")
    })
    public ResponseEntity<ApiResponse<Void>> deleteInvoice(
            @Parameter(description = "Invoice ID", required = true) @PathVariable UUID id) {

        log.info("DELETE /api/ap/invoices/{} - Deleting invoice", id);

        apInvoiceService.deleteInvoice(id);

        return ResponseEntity.ok(ApiResponse.success(null, "AP invoice deleted successfully"));
    }

    // ============================================================
    // STATUS TRANSITIONS (PATCH)
    // ============================================================

    @Deprecated(since = "2.0", forRemoval = true)
    @PatchMapping("/{id}/status")
    @Operation(summary = "Update Invoice Status (Deprecated)", description = "Deprecated. Use specific POST endpoints instead.")
    public ResponseEntity<Map<String, Object>> updateInvoiceStatus(
            @Parameter(description = "Invoice ID", required = true) @PathVariable UUID id,
            @Valid @RequestBody ApInvoiceStatusUpdateRequest request) {

        InvoiceStatus targetStatus = request.getStatus();
        apInvoiceService.updateInvoiceStatus(id, targetStatus);
        return buildActionResponse(id, targetStatus.name(), "Invoice status updated successfully.");
    }

    @Deprecated(since = "2.0", forRemoval = true)
    @PatchMapping("/{id}/posting-status")
    @Operation(summary = "Update Posting Status (Deprecated)", description = "Deprecated. Use specific POST endpoints instead.")
    public ResponseEntity<Map<String, Object>> updatePostingStatus(
            @Parameter(description = "Invoice ID", required = true) @PathVariable UUID id,
            @Valid @RequestBody ApInvoicePostingStatusUpdateRequest request) {

        com.erp.account.enums.PostingStatus targetStatus = request.getPostingStatus();
        apInvoiceService.updatePostingStatus(id, targetStatus);
        return buildActionResponse(id, targetStatus.name(), "Posting status updated successfully.");
    }

    // ============================================================
    // WORKFLOW ACTION ENDPOINTS
    // ============================================================

    @PostMapping("/{id}/submit-for-approval")
    @Operation(summary = "Submit for approval", description = "Submits a draft invoice for approval")
    public ResponseEntity<ApiResponse<ApInvoiceResponse>> submitForApproval(@PathVariable UUID id) {
        ApInvoiceResponse response = apInvoiceService.submitForApproval(id);
        return ResponseEntity.ok(ApiResponse.success(response, "AP invoice submitted for approval"));
    }

    @Operation(summary = "Adjust Advance Payment", description = "Adjusts an advance payment voucher against a POSTED invoice")
    @PostMapping("/{id}/adjust-advance")
    public ResponseEntity<ApiResponse<ApInvoiceProfileResponse>> adjustAdvance(
            @PathVariable UUID id,
            @Valid @RequestBody com.erp.account.modules.apinvoice.dto.request.AdvanceAdjustmentRequest request) {
        ApInvoiceProfileResponse response = apInvoiceService.adjustAdvance(id, request);
        return ResponseEntity.ok(ApiResponse.success(response, "Advance payment adjusted successfully"));
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve invoice", description = "Approves a pending invoice")
    public ResponseEntity<Map<String, Object>> approveInvoice(@PathVariable UUID id) {
        ApInvoiceResponse response = apInvoiceService.approveInvoice(id);
        return buildActionResponse(id, response.getStatus().name(), "Invoice approved successfully.");
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject invoice", description = "Rejects a pending invoice")
    public ResponseEntity<Map<String, Object>> rejectInvoice(@PathVariable UUID id) {
        ApInvoiceResponse response = apInvoiceService.rejectInvoice(id);
        return buildActionResponse(id, response.getStatus().name(), "Invoice rejected successfully.");
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel invoice", description = "Cancels a draft, pending, or approved invoice")
    public ResponseEntity<Map<String, Object>> cancelInvoice(@PathVariable UUID id) {
        ApInvoiceResponse response = apInvoiceService.cancelInvoice(id);
        return buildActionResponse(id, response.getStatus().name(), "Invoice cancelled successfully.");
    }

    @PostMapping("/{id}/post")
    @Operation(summary = "Post invoice to GL", description = "Posts an approved invoice to the General Ledger")
    public ResponseEntity<Map<String, Object>> postInvoice(@PathVariable UUID id) {
        ApInvoiceResponse response = apInvoiceService.postInvoice(id);
        return buildActionResponse(id, response.getStatus().name(), "Invoice posted to General Ledger successfully.");
    }

    @PostMapping("/{id}/reverse")
    @Operation(summary = "Reverse GL posting", description = "Reverses a posted invoice in the General Ledger")
    public ResponseEntity<Map<String, Object>> reverseInvoice(@PathVariable UUID id) {
        ApInvoiceResponse response = apInvoiceService.reverseInvoice(id);
        return buildActionResponse(id, response.getStatus().name(), "Invoice GL posting reversed successfully.");
    }

    @PostMapping("/{id}/void")
    @Operation(summary = "Void invoice", description = "Voids an invoice")
    public ResponseEntity<Map<String, Object>> voidInvoice(@PathVariable UUID id) {
        ApInvoiceResponse response = apInvoiceService.voidInvoice(id);
        return buildActionResponse(id, response.getStatus().name(), "Invoice voided successfully.");
    }

    @PostMapping("/{id}/write-off")
    @Operation(summary = "Write off invoice", description = "Writes off an unpaid or partially paid invoice")
    public ResponseEntity<Map<String, Object>> writeOffInvoice(@PathVariable UUID id) {
        ApInvoiceResponse response = apInvoiceService.writeOffInvoice(id);
        return buildActionResponse(id, response.getStatus().name(), "Invoice written off successfully.");
    }

    private ResponseEntity<Map<String, Object>> buildActionResponse(UUID id, String status, String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);

        Map<String, Object> data = new HashMap<>();
        data.put("id", id);
        data.put("status", status);
        response.put("data", data);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/partial-payment")
    @Operation(summary = "Record partial payment", description = "Records a partial payment for an invoice")
    public ResponseEntity<ApiResponse<ApInvoiceResponse>> recordPartialPayment(
            @Parameter(description = "Invoice ID", required = true) @PathVariable UUID id,
            @Parameter(description = "Payment amount", required = true) @RequestParam BigDecimal paidAmount) {

        log.info("POST /api/ap/invoices/{}/partial-payment - Recording payment: {}", id, paidAmount);

        ApInvoiceResponse response = apInvoiceService.markAsPartiallyPaid(id, paidAmount);

        return ResponseEntity.ok(ApiResponse.success(response, "Partial payment recorded successfully"));
    }

    // ============================================================
    // AGING ANALYSIS
    // ============================================================

    @GetMapping("/aging")
    @Operation(summary = "Get invoice aging report", description = "Generates invoice aging report with buckets: 0-30, 31-60, 61-90, 90+ days")
    public ResponseEntity<ApiResponse<Map<String, AgingReportHelper.AgingBucketSummary>>> getAgingReport() {
        UUID companyId = com.erp.account.util.TenantUtils.getCurrentCompanyId();
        log.info("GET /api/ap/invoices/aging - Generating aging report for company: {}", companyId);

        Map<String, AgingReportHelper.AgingBucketSummary> agingReport = apInvoiceService
                .getInvoiceAgingReport(companyId);

        return ResponseEntity.ok(ApiResponse.success(agingReport, "Aging report retrieved successfully"));
    }

    // ============================================================
    // FINANCIAL REPORTING
    // ============================================================

    @GetMapping("/summary")
    @Operation(summary = "Get invoice summary", description = "Returns summary totals for invoices")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getInvoiceSummary() {
        UUID companyId = com.erp.account.util.TenantUtils.getCurrentCompanyId();
        log.info("GET /api/ap/invoices/summary - Getting summary for company: {}", companyId);

        BigDecimal totalOutstanding = apInvoiceService.getTotalOutstandingAmount(companyId);
        BigDecimal totalPosted = apInvoiceService.getTotalPostedAmount(companyId);
        BigDecimal totalPaid = apInvoiceService.getTotalPaidAmount(companyId);

        Map<String, BigDecimal> summary = new HashMap<>();
        summary.put("totalPosted", totalPosted);
        summary.put("totalOutstanding", totalOutstanding);
        summary.put("totalPaid", totalPaid);

        return ResponseEntity.ok(ApiResponse.success(summary, "Invoice summary retrieved successfully"));
    }

    // ============================================================
    // EXCEPTION HANDLERS FOR MINIMAL ERROR RESPONSES
    // ============================================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
            org.springframework.web.bind.MethodArgumentNotValidException ex) {
        java.util.List<String> errors = new java.util.ArrayList<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(error -> errors.add(error.getField() + ": " + error.getDefaultMessage()));
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", "Invalid request data.");
        response.put("errors", errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(com.erp.account.common.exception.DuplicateResourceException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateResourceException(
            com.erp.account.common.exception.DuplicateResourceException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(BaseApplicationException.class)
    public ResponseEntity<Map<String, Object>> handleBaseApplicationException(
            com.erp.account.common.exception.BaseApplicationException ex) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", ex.getMessage());

        HttpStatus status = HttpStatus.BAD_REQUEST;
        if (ex instanceof com.erp.account.common.exception.ResourceNotFoundException) {
            status = HttpStatus.NOT_FOUND;
        } else if (ex instanceof com.erp.account.common.exception.ConflictException) {
            status = HttpStatus.CONFLICT;
        }
        return new ResponseEntity<>(response, status);
    }
}
