package com.erp.crm.modules.account.controller;

import com.erp.crm.common.dto.request.ApiRequest;
import com.erp.crm.common.dto.response.ApiResponse;
import com.erp.crm.modules.account.dto.request.AccountCreateRequest;
import com.erp.crm.modules.account.dto.response.AccountResponse;
import com.erp.crm.modules.account.service.CrmAccountService;
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
@RequestMapping("/api/crm/accounts")
@RequiredArgsConstructor
@Tag(name = "Account Management", description = "Endpoints for Corporate Accounts, B2B Clients & ERP Onboarding")
public class CrmAccountController {

    private final CrmAccountService accountService;

    @PostMapping
    @Operation(summary = "Create B2B Account")
    public ResponseEntity<ApiResponse<AccountResponse>> createAccount(
            @RequestBody @Valid ApiRequest<AccountCreateRequest> apiRequest,
            @RequestParam(required = false) UUID companyId) {
        AccountResponse response = accountService.createAccount(apiRequest.getData(), companyId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Account created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get Account Details by ID")
    public ResponseEntity<ApiResponse<AccountResponse>> getAccountById(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        AccountResponse response = accountService.getAccountById(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @Operation(summary = "List or Search Accounts")
    public ResponseEntity<ApiResponse<List<AccountResponse>>> getAccounts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID companyId,
            Pageable pageable) {
        if (search != null && !search.isBlank()) {
            List<AccountResponse> results = accountService.searchAccounts(search, companyId);
            return ResponseEntity.ok(ApiResponse.success(results));
        }
        Page<AccountResponse> page = accountService.getAllAccounts(companyId, pageable);
        return ResponseEntity.ok(ApiResponse.paginated(page, "Accounts fetched successfully"));
    }

    @PostMapping("/{id}/onboard-erp")
    @Operation(summary = "Onboard CRM Account into Official ERP Customer Master")
    public ResponseEntity<ApiResponse<AccountResponse>> onboardToErp(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID companyId) {
        AccountResponse response = accountService.onboardToErp(id, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Account onboarded to ERP successfully"));
    }
}

