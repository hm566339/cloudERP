package com.erp.account.modules.bankaccount.controller;

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.bankaccount.dto.response.BankAccountListResponse;
import com.erp.account.modules.bankaccount.dto.response.BankAccountResponse;
import com.erp.account.modules.bankaccount.dto.response.BankLedgerPageResult;
import com.erp.account.modules.bankaccount.dto.response.BankReconciliationResponse;
import com.erp.account.modules.bankaccount.dto.response.profile.BankAccountProfileResponse;
import com.erp.account.modules.bankaccount.dto.request.BankAccountRequest;
import com.erp.account.modules.bankaccount.dto.request.BankAccountFilterDto;
import com.erp.account.enums.BankAccountType;
import com.erp.account.modules.bankaccount.service.BankAccountService;
import com.erp.account.modules.banktransaction.dto.response.BankLedgerResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/account/bank-accounts")
public class BankAccountController {

    private final BankAccountService bankAccountService;

    public BankAccountController(BankAccountService bankAccountService) {
        this.bankAccountService = bankAccountService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BankAccountResponse>> createBankAccount(
            @Valid @RequestBody RequestWrapper<BankAccountRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {
        BankAccountRequest request = requestWrapper.unwrap();
        BankAccountResponse response = bankAccountService.createBankAccount(requestWrapper, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Bank account created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BankAccountResponse>> updateBankAccount(
            @PathVariable("id") UUID id,
            @Valid @RequestBody RequestWrapper<BankAccountRequest> requestWrapper) {
        BankAccountRequest request = requestWrapper.unwrap();
        BankAccountResponse response = bankAccountService.updateBankAccount(id, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Bank account updated successfully"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBankAccount(@PathVariable("id") UUID id) {
        bankAccountService.deleteBankAccount(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BankAccountProfileResponse>> getBankAccountById(@PathVariable("id") UUID id) {
        BankAccountProfileResponse response = bankAccountService.getBankAccountById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Bank account retrieved successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<BankAccountListResponse>> getAllBankAccounts(
            @ModelAttribute BankAccountFilterDto filter,
            Pageable pageable) {
        BankAccountListResponse response = bankAccountService.getAllBankAccounts(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Bank accounts retrieved successfully"));
    }

    @GetMapping("/number/{accountNumber}")
    public ResponseEntity<ApiResponse<BankAccountResponse>> getBankAccountByNumber(
            @PathVariable("accountNumber") String accountNumber) {
        BankAccountResponse response = bankAccountService.getBankAccountByNumber(accountNumber);
        return ResponseEntity.ok(ApiResponse.success(response, "Bank account retrieved successfully"));
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<BankAccountResponse>> activateBankAccount(@PathVariable("id") UUID id) {
        BankAccountResponse response = bankAccountService.activateBankAccount(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Bank account activated successfully"));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<BankAccountResponse>> deactivateBankAccount(@PathVariable("id") UUID id) {
        BankAccountResponse response = bankAccountService.deactivateBankAccount(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Bank account deactivated successfully"));
    }

    @PatchMapping("/{id}/primary")
    public ResponseEntity<ApiResponse<BankAccountResponse>> setAsPrimary(@PathVariable("id") UUID id) {
        BankAccountResponse response = bankAccountService.setAsPrimary(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Bank account set as primary successfully"));
    }

    @GetMapping("/{id}/ledger")
    public ResponseEntity<ApiResponse<BankLedgerResponse>> getBankLedger(
            @PathVariable("id") UUID id,
            Pageable pageable) {
        BankLedgerPageResult result = bankAccountService.getBankLedger(id, pageable);
        ApiResponse<BankLedgerResponse> apiResponse =
                ApiResponse.<BankLedgerResponse>builder()
                        .success(true)
                        .message("Bank ledger fetched successfully")
                        .data(result.getLedgerResponse())
                        .pagination(result.getPagination())
                        .status(HttpStatus.OK.value())
                        .timestamp(LocalDateTime.now())
                        .build();
        return ResponseEntity.ok(apiResponse);
    }

    @GetMapping("/{id}/reconciliation")
    public ResponseEntity<ApiResponse<BankReconciliationResponse>> getBankReconciliation(
            @PathVariable("id") UUID id,
            @RequestParam("bankStatementBalance") BigDecimal bankStatementBalance,
            Pageable pageable) {
        BankReconciliationResponse response = bankAccountService.getReconciliationSummary(id, bankStatementBalance,
                pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Bank reconciliation retrieved successfully"));
    }
}
