package com.erp.account.modules.rfq.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.rfq.dto.RfqEmailDispatchResponse;
import com.erp.account.modules.rfq.dto.RfqRequest;
import com.erp.account.modules.rfq.dto.RfqResponse;
import com.erp.account.modules.rfq.dto.RfqSendResponse;
import com.erp.account.modules.rfq.service.RfqEmailService;
import com.erp.account.modules.rfq.service.RfqService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/account/rfqs")
@RequiredArgsConstructor
@Tag(name = "RFQ API", description = "Request for Quotation management and vendor email dispatch")
public class RfqController {

    private final RfqService service;
    private final RfqEmailService emailService;

    @Operation(summary = "Create RFQ", description = "Creates a new Request for Quotation in DRAFT status.")
    @PostMapping
    public ResponseEntity<ApiResponse<RfqResponse>> create(
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<RfqRequest> w) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(companyId, w.unwrap()), "RFQ created successfully"));
    }

    @Operation(summary = "List RFQs", description = "Retrieves paginated list of RFQs.")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<RfqResponse>>> list(
            @RequestParam(required = false) UUID companyId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable p) {
        return ResponseEntity.ok(ApiResponse.success(service.list(companyId, p), "RFQs retrieved successfully"));
    }

    @Operation(summary = "Get RFQ by ID", description = "Fetches complete RFQ details by ID.")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RfqResponse>> get(
            @Parameter(description = "RFQ ID") @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(service.get(companyId, id), "RFQ retrieved successfully"));
    }

    @Operation(summary = "Update RFQ", description = "Updates an existing DRAFT RFQ.")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RfqResponse>> update(
            @Parameter(description = "RFQ ID") @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId,
            @Valid @RequestBody RequestWrapper<RfqRequest> w) {
        return ResponseEntity.ok(ApiResponse.success(service.update(companyId, id, w.unwrap()), "RFQ updated successfully"));
    }

    @Operation(
            summary = "Send RFQ",
            description = "Transitions the RFQ from DRAFT to SENT. For each vendor with a valid email, "
                    + "generates a PDF and dispatches it as an attachment. Vendors without a valid email "
                    + "are skipped — missing or invalid email never blocks the status transition. "
                    + "The response includes email dispatch statistics (emailSent, emailsSentCount, "
                    + "emailsFailedCount, vendorsWithoutEmail)."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "RFQ marked as SENT. Email dispatch results included in the response body."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "RFQ is not in DRAFT status or has no vendors"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "RFQ or Vendor not found")
    })
    @PostMapping("/{id}/send")
    public ResponseEntity<ApiResponse<RfqSendResponse>> send(
            @Parameter(description = "RFQ ID to send") @PathVariable UUID id,
            @Parameter(description = "Tenant Company ID (optional, resolved from context if omitted)") @RequestParam(required = false) UUID companyId) {
        RfqSendResponse result = service.send(companyId, id);
        return ResponseEntity.ok(ApiResponse.success(result, result.getMessage()));
    }

    @Operation(
            summary = "Send RFQ Email",
            description = "Dispatches RFQ emails to all associated vendors. Generates PDF for each vendor and sends an email. Can be used to retry email dispatch for an already SENT RFQ. Returns detailed vendor-level email delivery results."
    )
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "RFQ email dispatch completed. Email dispatch results included in the response body."),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "RFQ is in CLOSED or CANCELLED status, or has no vendors"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "RFQ or Vendor not found")
    })
    @PostMapping("/{id}/send-email")
    public ResponseEntity<ApiResponse<RfqEmailDispatchResponse>> sendEmail(
            @Parameter(description = "RFQ ID to send email for") @PathVariable UUID id,
            @Parameter(description = "Tenant Company ID (optional, resolved from context if omitted)") @RequestParam(required = false) UUID companyId) {
        RfqEmailDispatchResponse result = emailService.dispatchRfqEmails(companyId, id);
        String message = result.getEmailsFailedCount() > 0 ? "RFQ email dispatch completed with failures" : "RFQ email dispatch completed";
        return ResponseEntity.ok(ApiResponse.success(result, message));
    }

    @Operation(summary = "Close RFQ", description = "Closes an active RFQ.")
    @PostMapping("/{id}/close")
    public ResponseEntity<ApiResponse<RfqResponse>> close(
            @Parameter(description = "RFQ ID") @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(service.close(companyId, id), "RFQ closed successfully"));
    }

    @Operation(summary = "Cancel RFQ", description = "Cancels an RFQ.")
    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<RfqResponse>> cancel(
            @Parameter(description = "RFQ ID") @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        return ResponseEntity.ok(ApiResponse.success(service.cancel(companyId, id), "RFQ cancelled successfully"));
    }
}
