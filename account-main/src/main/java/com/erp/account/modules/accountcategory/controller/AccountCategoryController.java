package com.erp.account.modules.accountcategory.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
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

import com.erp.account.modules.accountcategory.dto.response.AccountCategoryResponse;
import com.erp.account.modules.accountcategory.dto.response.AccountCategoryResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.accountcategory.dto.request.AccountCategoryFilterDto;
import com.erp.account.modules.accountcategory.dto.request.AccountCategoryRequest;
import com.erp.account.modules.accountcategory.service.AccountCategoryService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/account/account-categories")
@AllArgsConstructor
@Slf4j
public class AccountCategoryController {

    private final AccountCategoryService accountCategoryService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostResponse>> createAccountCategory(
            @RequestBody RequestWrapper<AccountCategoryRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {

        log.info("Received request to create account category");

        PostResponse response = accountCategoryService.createAccountCategory(requestWrapper, companyId);

        return ResponseEntity.ok(ApiResponse.success(response, "Account category created successfully"));
    }

    @PutMapping("/{accountCategoryId}")
    public ResponseEntity<ApiResponse<PostResponse>> updateAccountCategory(
            @PathVariable("accountCategoryId") UUID accountCategoryId,
            @RequestBody RequestWrapper<AccountCategoryRequest> requestWrapper) {
        log.info("Received request to update account category with ID: {}", accountCategoryId);

        PostResponse response = accountCategoryService.updateAccountCategory(accountCategoryId, requestWrapper);
        log.info("Account category updated successfully for ID: {}", accountCategoryId);

        return ResponseEntity.ok(ApiResponse.success(response, "Account category updated successfully"));
    }

    @DeleteMapping("/{accountCategoryId}")
    public ResponseEntity<ApiResponse<PostResponse>> deleteAccountCategory(
            @PathVariable("accountCategoryId") UUID accountCategoryId) {
        log.info("Received request to delete account category with ID: {}", accountCategoryId);

        PostResponse response = accountCategoryService.deleteAccountCategory(accountCategoryId);
        log.info("Account category deleted successfully for ID: {}", accountCategoryId);

        return ResponseEntity.ok(ApiResponse.success(response, "Account category deleted successfully"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<AccountCategoryResponseList>> getAllAccountCategories(
            @ModelAttribute AccountCategoryFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {
        log.info("Received request to get all account categories");

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, resolvedSortBy));

        AccountCategoryResponseList response = accountCategoryService.getAllAccountCategories(filter, pageable);
        log.info("Account categories retrieved successfully");

        return ResponseEntity.ok(ApiResponse.success(response, "Account categories retrieved successfully"));
    }

    @PatchMapping("/{accountCategoryId}")
    public ResponseEntity<ApiResponse<PostResponse>> softDeleteAccountCategory(
            @PathVariable("accountCategoryId") UUID accountCategoryId) {
        log.info("Received request to soft delete account category with ID: {}", accountCategoryId);

        PostResponse response = accountCategoryService.deleteAccountCategory(accountCategoryId);
        log.info("Account category soft deleted successfully for ID: {}", accountCategoryId);

        return ResponseEntity.ok(ApiResponse.success(response, "Account category deleted successfully"));
    }

    @GetMapping("/{accountCategoryId}")
    @io.swagger.v3.oas.annotations.Operation(summary = "Get account category by ID with full profile")
    public ResponseEntity<ApiResponse<com.erp.account.modules.accountcategory.dto.response.AccountCategoryProfileResponse>> getAccountCategoryById(
            @PathVariable UUID accountCategoryId) {
        log.info("Received request to get account category with ID: {}", accountCategoryId);

        com.erp.account.modules.accountcategory.dto.response.AccountCategoryProfileResponse response = accountCategoryService.getAccountCategoryById(accountCategoryId);
        log.info("Account category retrieved successfully for ID: {}", accountCategoryId);

        return ResponseEntity.ok(ApiResponse.success(response, "Account category retrieved successfully"));
    }

}
