package com.erp.account.modules.accountingperiod.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ModelAttribute;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;

import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodCreateResponse;
import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodResponse;
import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodProfileResponse;
import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodCreateRequest;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodFilterDto;
import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodRequest;
import com.erp.account.modules.accountingperiod.service.AccountingPeriodService;

import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/account/accounting-periods")
@AllArgsConstructor
@Slf4j
public class AccountingPeriodController {

        private final AccountingPeriodService accountingPeriodService;

        @PostMapping("/preset")
        public ResponseEntity<ApiResponse<AccountingPeriodCreateResponse>> createAccountingPeriodsFromPreset(
                        @Valid @RequestBody RequestWrapper<AccountingPeriodCreateRequest> requestWrapper) {
                AccountingPeriodCreateResponse response = accountingPeriodService.createAccountingPeriodsFromPreset(requestWrapper);
                return ResponseEntity.ok(ApiResponse.success(response, "Accounting periods created successfully"));
        }

        @PostMapping("/{fiscalYearId}")
        public ResponseEntity<ApiResponse<PostResponse>> createAccountingPeriod(
                        @Valid @RequestBody RequestWrapper<AccountingPeriodRequest> requestWrapper,
                        @PathVariable("fiscalYearId") UUID fiscalYearId) {

                AccountingPeriodRequest request = requestWrapper.unwrap();
                log.info("Received request to create accounting period for fiscal year ID: {}", fiscalYearId);

                PostResponse response = accountingPeriodService.createAccountingPeriod(requestWrapper, fiscalYearId);

                log.info("Accounting period created successfully for fiscal year ID: {}", fiscalYearId);

                return ResponseEntity.ok(ApiResponse.success(response, "Accounting period created successfully"));
        }

        @PutMapping("/{accountingPeriodId}")
        public ResponseEntity<ApiResponse<PostResponse>> updateAccountingPeriod(
                        @Valid @RequestBody RequestWrapper<AccountingPeriodRequest> requestWrapper,
                        @PathVariable("accountingPeriodId") UUID accountingPeriodId) {
                AccountingPeriodRequest request = requestWrapper.unwrap();
                log.info("Received request to update accounting period with ID: {}", accountingPeriodId);
                PostResponse response = accountingPeriodService.updateAccountingPeriod(requestWrapper, accountingPeriodId);
                log.info("Accounting period updated successfully with ID: {}", accountingPeriodId);
                return ResponseEntity
                                .ok(ApiResponse.success(response, "Accounting period updated successfully"));
        }

        @GetMapping("/{accountingPeriodId}")
        @Operation(summary = "Get accounting period profile by ID", description = "Get complete details of a specific accounting period including financial summary, transactions, and audit information.")
        @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_ADMIN', 'ACCOUNTANT', 'VIEWER')")
        public ResponseEntity<ApiResponse<AccountingPeriodProfileResponse>> getAccountingPeriodById(
                        @PathVariable UUID accountingPeriodId) {
                log.info("REST request to get accounting period profile: {}", accountingPeriodId);

                AccountingPeriodProfileResponse response = accountingPeriodService.getAccountingPeriodById(accountingPeriodId);
                return ResponseEntity.ok(ApiResponse.success(
                                response,
                                "Accounting period profile retrieved successfully"));
        }

        @Operation(summary = "Get accounting periods", description = "Returns accounting periods for the current company for non-admin users or across all companies for system admins")
        @GetMapping
        public ResponseEntity<ApiResponse<AccountingPeriodResponseList>> getAllAccountingPeriods(
                        @ModelAttribute AccountingPeriodFilterDto filter,
                        @Parameter(description = "Page number (0-indexed)", required = false) @RequestParam(defaultValue = "0") int page,
                        @Parameter(description = "Page size", required = false) @RequestParam(name = "size", defaultValue = "10") int size,
                        @Parameter(description = "Sort field", required = false) @RequestParam(required = false) String sortBy,
                        @Parameter(description = "Sort direction (ASC/DESC)", required = false) @RequestParam(required = false, defaultValue = "desc") String sortDir) {

                log.info("Received request to get all accounting periods with pagination");

                Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
                String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
                Pageable pageable = PageRequest.of(page, size, Sort.by(direction, resolvedSortBy));

                var response = accountingPeriodService.getAllAccountingPeriods(filter, pageable);

                return ResponseEntity.ok(ApiResponse.success(response, "Accounting periods retrieved successfully"));
        }

        @DeleteMapping("/{accountingPeriodId}")
        public ResponseEntity<ApiResponse<PostResponse>> deleteAccountingPeriod(
                        @PathVariable("accountingPeriodId") UUID accountingPeriodId) {
                log.info("Received request to delete accounting period with ID: {}", accountingPeriodId);
                PostResponse response = accountingPeriodService.deleteAccountingPeriod(accountingPeriodId);
                log.info("Accounting period deleted successfully with ID: {}", accountingPeriodId);
                return ResponseEntity.ok(ApiResponse.success(response, "Accounting period deleted successfully"));
        }

        @PatchMapping("/{accountingPeriodId}/toggle-status")
        public ResponseEntity<ApiResponse<PostResponse>> toggleAccountingPeriodStatus(
                        @PathVariable("accountingPeriodId") UUID accountingPeriodId) {
                log.info("Received request to toggle status of accounting period with ID: {}", accountingPeriodId);
                PostResponse response = accountingPeriodService.toggleAccountingPeriodStatus(accountingPeriodId);
                log.info("Accounting period status toggled successfully with ID: {}", accountingPeriodId);
                return ResponseEntity.ok(ApiResponse.success(response, "Accounting period status toggled successfully"));
        }

}
