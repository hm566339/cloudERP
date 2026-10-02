package com.erp.account.modules.quotation.controller;

import com.erp.account.modules.quotation.dto.request.QuotationAcceptRequest;
import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;
import com.erp.account.modules.quotation.service.QuotationAcceptanceTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.erp.account.common.dto.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/account/v1/quotations")
@RequiredArgsConstructor
@Tag(name = "Quotation Acceptance", description = "Endpoints for quotation acceptance")
public class QuotationAcceptanceController {

    private final QuotationAcceptanceTokenService tokenService;

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
}
