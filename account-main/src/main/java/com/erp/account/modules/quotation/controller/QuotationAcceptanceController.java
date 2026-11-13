package com.erp.account.modules.quotation.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.quotation.dto.request.QuotationAcceptRequest;
import com.erp.account.modules.quotation.dto.request.QuotationRejectRequest;
import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;
import com.erp.account.modules.quotation.dto.response.QuotationPublicViewResponse;
import com.erp.account.modules.quotation.dto.response.QuotationRejectResponse;
import com.erp.account.modules.quotation.service.QuotationAcceptanceTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account/v1/quotations")
@RequiredArgsConstructor
@Tag(name = "Quotation Acceptance", description = "Endpoints for quotation public access, acceptance, and rejection")
public class QuotationAcceptanceController {

    private final QuotationAcceptanceTokenService tokenService;

    @Operation(summary = "Get Public Quotation Details", description = "Retrieves sanitized customer-facing quotation details using a public token. No authentication required.")
    @GetMapping("/public/{token}")
    public ResponseEntity<ApiResponse<QuotationPublicViewResponse>> getPublicQuotation(@PathVariable String token) {
        QuotationPublicViewResponse response = tokenService.getPublicQuotation(token);
        return ResponseEntity.ok(ApiResponse.success(response, "Quotation retrieved successfully"));
    }

    @Operation(summary = "Accept Quotation (Internal)", description = "Requires a request body with the token.")
    @PostMapping("/accept")
    public ResponseEntity<QuotationAcceptResponse> acceptQuotation(@RequestBody QuotationAcceptRequest request) {
        QuotationAcceptResponse response = tokenService.acceptQuotation(request.getToken());
        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Publicly Accept Quotation", description = "Accepts a quotation using a public token in the path. No authentication required.")
    @PostMapping("/public/accept/{token}")
    public ResponseEntity<ApiResponse<QuotationAcceptResponse>> acceptQuotationPublic(@PathVariable String token) {
        QuotationAcceptResponse response = tokenService.acceptQuotation(token);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }

    @Operation(summary = "Publicly Reject Quotation", description = "Declines a quotation using a public token in the path with optional rejection reason. No authentication required.")
    @PostMapping("/public/reject/{token}")
    public ResponseEntity<ApiResponse<QuotationRejectResponse>> rejectQuotationPublic(
            @PathVariable String token,
            @RequestBody(required = false) QuotationRejectRequest request) {
        String reason = request != null ? request.getReason() : null;
        QuotationRejectResponse response = tokenService.rejectQuotation(token, reason);
        return ResponseEntity.ok(ApiResponse.success(response, response.getMessage()));
    }
}
