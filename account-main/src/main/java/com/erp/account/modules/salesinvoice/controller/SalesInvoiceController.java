package com.erp.account.modules.salesinvoice.controller;

import com.erp.account.modules.salesinvoice.dto.SalesInvoiceRequest;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceResponse;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceProfileResponse;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceFilterDto;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.common.service.EmailService;
import com.erp.account.modules.salesinvoice.service.SalesInvoicePdfService;
import com.erp.account.modules.salesinvoice.service.SalesInvoiceService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/account/sales/invoices")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Sales Invoices", description = "Sales Invoice Management APIs")
public class SalesInvoiceController {

    private final SalesInvoiceService salesInvoiceService;
    private final SalesInvoicePdfService salesInvoicePdfService;
    private final EmailService emailService;

    @PostMapping
    @Operation(summary = "Create new sales invoice", description = "Creates a new sales invoice in DRAFT status")
    public ResponseEntity<ApiResponse<SalesInvoiceResponse>> createInvoice(
            @Valid @RequestBody RequestWrapper<SalesInvoiceRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        SalesInvoiceRequest request = requestWrapper.unwrap();
        log.info("REST: Creating sales invoice: {}", request.getInvoiceNumber());

        SalesInvoiceResponse response = salesInvoiceService.createInvoice(requestWrapper, companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Sales invoice created successfully"));
    }

    @PutMapping("/{invoiceId}")
    @Operation(summary = "Update sales invoice", description = "Updates an existing DRAFT sales invoice")
    public ResponseEntity<ApiResponse<SalesInvoiceResponse>> updateInvoice(
            @PathVariable UUID invoiceId,
            @Valid @RequestBody RequestWrapper<SalesInvoiceRequest> requestWrapper) {
        log.info("REST: Updating sales invoice: {}", invoiceId);

        SalesInvoiceResponse response = salesInvoiceService.updateInvoice(invoiceId, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales invoice updated successfully"));
    }

    @DeleteMapping("/{invoiceId}")
    @Operation(summary = "Delete sales invoice", description = "Soft-deletes a DRAFT sales invoice")
    public ResponseEntity<ApiResponse<Void>> deleteInvoice(
            @PathVariable UUID invoiceId) {
        log.info("REST: Deleting sales invoice: {}", invoiceId);

        salesInvoiceService.deleteInvoice(invoiceId);
        return ResponseEntity.ok(ApiResponse.success(null, "Sales invoice deleted successfully"));
    }

    @GetMapping("/{invoiceId}")
    @Operation(summary = "Get invoice profile by ID", description = "Retrieves complete invoice profile with accounting, tax, line items, audit, and logistics details")
    public ResponseEntity<ApiResponse<SalesInvoiceProfileResponse>> getInvoice(
            @PathVariable UUID invoiceId) {
        log.info("REST: Fetching invoice profile: {}", invoiceId);

        SalesInvoiceProfileResponse response = salesInvoiceService.getInvoiceById(invoiceId);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales invoice profile retrieved successfully"));
    }

    @GetMapping("/number/{invoiceNumber}")
    @Operation(summary = "Get invoice by number", description = "Retrieves an invoice by invoice number")
    public ResponseEntity<ApiResponse<SalesInvoiceResponse>> getInvoiceByNumber(
            @PathVariable String invoiceNumber) {
        log.info("REST: Fetching invoice by number: {}", invoiceNumber);

        SalesInvoiceResponse response = salesInvoiceService.getInvoiceByNumber(invoiceNumber);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales invoice retrieved successfully"));
    }

    @GetMapping(path = "/{invoiceId}/pdf")
    @Operation(summary = "Download invoice PDF", description = "Generates and downloads the tax invoice and e-way bill PDF")
    public void downloadInvoicePdf(
            @PathVariable UUID invoiceId,
            @RequestParam(required = false) UUID companyId,
            jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        log.info("REST: Downloading invoice PDF for: {}", invoiceId);

        try {
            var invoice = salesInvoiceService.getInvoiceById(invoiceId);
            byte[] pdfBytes = salesInvoicePdfService.generateSalesInvoicePdf(invoiceId, companyId);

            response.setContentType(MediaType.APPLICATION_PDF_VALUE);
            response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"" + invoice.getInvoiceNumber() + ".pdf\"");
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
    @Operation(summary = "Send invoice PDF via email", description = "Generates the invoice PDF and sends it to the customer's email address")
    public ResponseEntity<ApiResponse<Void>> sendInvoiceEmail(
            @PathVariable UUID invoiceId,
            @RequestParam(required = false) UUID companyId) {
        log.info("REST: Sending invoice PDF via email for: {}", invoiceId);

        // Fetch the invoice profile to get customer email and invoice details
        SalesInvoiceProfileResponse profile = salesInvoiceService.getInvoiceById(invoiceId);
        String customerEmail = profile.getCustomerInformation() != null ? profile.getCustomerInformation().getEmail()
                : null;

        if (customerEmail == null || customerEmail.isBlank()) {
            throw new IllegalArgumentException("Customer email address is not available");
        }

        // Generate the PDF
        byte[] pdfBytes = salesInvoicePdfService.generateSalesInvoicePdf(invoiceId, companyId);

        // Prepare email
        String companyName = profile.getCompanyInformation() != null ? profile.getCompanyInformation().getCompanyName()
                : "Our Company";
        String customerName = profile.getCustomerInformation() != null
                ? profile.getCustomerInformation().getCustomerName()
                : "Customer";

        String subject = "Invoice " + profile.getInvoiceNumber() + " from " + companyName;
        String body = "Dear " + customerName + ",\n\n" +
                "Please find attached your invoice " + profile.getInvoiceNumber() + " dated " + profile.getInvoiceDate()
                + ".\n\n" +
                "Total Amount: " + profile.getBaseCurrencyAmount() + "\n" +
                "Due Date: " + profile.getDueDate() + "\n\n" +
                "Thank you for your business.\n\n" +
                "Regards,\n" + companyName;

        String filename = "invoice-" + profile.getInvoiceNumber() + ".pdf";

        // Send email
        emailService.sendEmailWithPdfAttachment(customerEmail, subject, body, pdfBytes, filename);

        return ResponseEntity.ok(ApiResponse.success(null, "Invoice email sent successfully to " + customerEmail));
    }

    @GetMapping
    @Operation(summary = "Get all invoices", description = "Retrieves all invoices for a company with pagination and advanced filtering")
    public ResponseEntity<ApiResponse<Page<SalesInvoiceResponse>>> listInvoices(
            @ModelAttribute SalesInvoiceFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "invoiceDate,desc") String sort) {
        log.info("REST: Listing invoices page: {} size: {} with filter: {}", page, size, filter);

        String[] sortParams = sort.split(",", 2);
        String sortProperty = "invoiceDate";
        String sortDirection = "desc";

        if (sortParams.length == 1) {
            String candidate = sortParams[0].trim();
            if ("asc".equalsIgnoreCase(candidate) || "desc".equalsIgnoreCase(candidate)) {
                sortDirection = candidate;
            } else if (!candidate.isBlank()) {
                sortProperty = candidate;
            }
        } else {
            if (!sortParams[0].isBlank()) {
                sortProperty = sortParams[0].trim();
            }
            if (!sortParams[1].isBlank()) {
                sortDirection = sortParams[1].trim();
            }
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, sortProperty));

        Page<SalesInvoiceResponse> response = salesInvoiceService.getAllInvoices(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales invoices retrieved successfully"));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get customer invoices", description = "Retrieves all invoices for a specific customer")
    public ResponseEntity<ApiResponse<Page<SalesInvoiceResponse>>> getCustomerInvoices(
            @PathVariable UUID customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("REST: Fetching invoices for customer: {}", customerId);

        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.DESC, "invoiceDate"));
        Page<SalesInvoiceResponse> response = salesInvoiceService.getCustomerInvoices(customerId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Customer invoices retrieved successfully"));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get invoices by status", description = "Retrieves invoices filtered by status")
    public ResponseEntity<ApiResponse<Page<SalesInvoiceResponse>>> getInvoicesByStatus(
            @PathVariable InvoiceStatus status,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("REST: Fetching invoices with status: {}", status);

        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        Page<SalesInvoiceResponse> response = salesInvoiceService.getInvoicesByStatus(status, pageable, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales invoices retrieved successfully"));
    }

    @GetMapping("/outstanding")
    @Operation(summary = "Get outstanding invoices", description = "Retrieves invoices with pending payment")
    public ResponseEntity<ApiResponse<Page<SalesInvoiceResponse>>> getOutstandingInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("REST: Fetching outstanding invoices");

        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.ASC, "dueDate"));
        Page<SalesInvoiceResponse> response = salesInvoiceService.getOutstandingInvoices(pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Outstanding invoices retrieved successfully"));
    }

    @GetMapping("/overdue")
    @Operation(summary = "Get overdue invoices", description = "Retrieves invoices past due date with pending payment")
    public ResponseEntity<ApiResponse<Page<SalesInvoiceResponse>>> getOverdueInvoices(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) LocalDate asOfDate) {
        log.info("REST: Fetching overdue invoices");

        LocalDate refDate = asOfDate != null ? asOfDate : LocalDate.now();
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(Sort.Direction.ASC, "dueDate"));
        Page<SalesInvoiceResponse> response = salesInvoiceService.getOverdueInvoices(refDate, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Overdue invoices retrieved successfully"));
    }

    @GetMapping("/customer/{customerId}/outstanding-balance")
    @Operation(summary = "Get customer outstanding balance", description = "Retrieves total outstanding amount for customer")
    public ResponseEntity<ApiResponse<BigDecimal>> getCustomerOutstandingBalance(
            @PathVariable UUID customerId) {
        log.info("REST: Fetching outstanding balance for customer: {}", customerId);

        BigDecimal balance = salesInvoiceService.getCustomerOutstandingBalance(customerId);
        return ResponseEntity.ok(ApiResponse.success(balance, "Customer outstanding balance retrieved successfully"));
    }

    @GetMapping("/aging")
    @Operation(summary = "Get invoice aging report", description = "Retrieves aging analysis of outstanding invoices")
    public ResponseEntity<ApiResponse<SalesInvoiceService.AgingReportDTO>> getAgingReport(
            @RequestParam(required = false) LocalDate asOfDate) {
        log.info("REST: Generating aging report");

        LocalDate refDate = asOfDate != null ? asOfDate : LocalDate.now();
        SalesInvoiceService.AgingReportDTO report = salesInvoiceService.getInvoiceAging(refDate);
        return ResponseEntity.ok(ApiResponse.success(report, "Aging report retrieved successfully"));
    }

    @PostMapping({"/{invoiceId}/submit-for-approval", "/{invoiceId}/submit-approval", "/{invoiceId}/submit"})
    @Operation(summary = "Submit sales invoice for approval", description = "Submits a DRAFT sales invoice for workflow approval")
    public ResponseEntity<ApiResponse<SalesInvoiceResponse>> submitForApproval(
            @PathVariable UUID invoiceId,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String comments,
            @RequestBody(required = false) Map<String, String> body) {
        log.info("REST: Submitting sales invoice for approval: {}", invoiceId);
        String effectiveComments = comments != null ? comments : (body != null ? body.get("comments") : null);
        SalesInvoiceResponse response = salesInvoiceService.submitForApproval(companyId, invoiceId, effectiveComments);
        return ResponseEntity.ok(ApiResponse.success(response, "Sales invoice submitted for approval successfully"));
    }

    @PostMapping("/{invoiceId}/approve")
    @Operation(summary = "Approve invoice", description = "Approves a DRAFT invoice")
    public ResponseEntity<Map<String, Object>> approveInvoice(
            @PathVariable UUID invoiceId) {
        log.info("REST: Approving invoice: {}", invoiceId);

        salesInvoiceService.approveInvoice(invoiceId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Invoice approved successfully."));
    }

    @PostMapping("/{invoiceId}/reject")
    @Operation(summary = "Reject invoice", description = "Rejects a DRAFT or PENDING_APPROVAL invoice")
    public ResponseEntity<Map<String, Object>> rejectInvoice(
            @PathVariable UUID invoiceId) {
        log.info("REST: Rejecting invoice: {}", invoiceId);

        salesInvoiceService.rejectInvoice(invoiceId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Invoice rejected successfully."));
    }

    @PostMapping("/{invoiceId}/post")
    @Operation(summary = "Post invoice to GL", description = "Posts an APPROVED invoice to General Ledger (creates GL journal entry)")
    public ResponseEntity<Map<String, Object>> postInvoice(
            @PathVariable UUID invoiceId) {
        log.info("REST: Posting invoice to GL: {}", invoiceId);

        salesInvoiceService.postInvoice(invoiceId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Invoice posted successfully."));
    }

    @PostMapping("/{invoiceId}/cancel")
    @Operation(summary = "Cancel invoice", description = "Cancels an invoice (reverses GL posting if already posted)")
    public ResponseEntity<Map<String, Object>> cancelInvoice(
            @PathVariable UUID invoiceId) {
        log.info("REST: Cancelling invoice: {}", invoiceId);

        salesInvoiceService.cancelInvoice(invoiceId);
        return ResponseEntity.ok(Map.of("success", true, "message", "Invoice cancelled successfully."));
    }

    @GetMapping("/reports/summary")
    @Operation(summary = "Get sales summary", description = "Retrieves summary statistics for all invoices")
    public ResponseEntity<ApiResponse<SalesInvoiceService.SalesInvoiceSummaryDTO>> getSalesSummary() {
        log.info("REST: Generating sales summary");

        SalesInvoiceService.SalesInvoiceSummaryDTO summary = salesInvoiceService.getSalesSummary();
        return ResponseEntity.ok(ApiResponse.success(summary, "Sales summary retrieved successfully"));
    }

    @GetMapping("/reports/customer/{customerId}/summary")
    @Operation(summary = "Get customer sales summary", description = "Retrieves summary for specific customer")
    public ResponseEntity<ApiResponse<SalesInvoiceService.CustomerSalesSummaryDTO>> getCustomerSalesSummary(
            @PathVariable UUID customerId) {
        log.info("REST: Generating sales summary for customer: {}", customerId);

        SalesInvoiceService.CustomerSalesSummaryDTO summary = salesInvoiceService.getCustomerSalesSummary(customerId);
        return ResponseEntity.ok(ApiResponse.success(summary, "Customer sales summary retrieved successfully"));
    }
}
