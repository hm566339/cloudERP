package com.erp.account.modules.ledger.controller;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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

import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.enums.AccountNature;
import com.erp.account.modules.ledger.dto.request.ChartOfAccountFilterDto;
import com.erp.account.modules.ledger.dto.request.ChartOfAccountRequest;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountListResponse;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountResponse;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountProfileResponse;
import com.erp.account.modules.ledger.service.ChartOfAccountService;
import com.erp.account.util.TenantUtils;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/account/chart-of-accounts")
@Tag(name = "Chart of Accounts", description = "Chart of account management APIs")
@SecurityRequirement(name = "bearerAuth")
@RequiredArgsConstructor
@Slf4j
public class ChartOfAccountController {

    private final ChartOfAccountService chartOfAccountService;

    @PostMapping
    @Operation(summary = "Create chart of account", description = "Create a new chart of account under the current tenant company")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Account created successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied or company mismatch"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Referenced entity not found")
    })
    public ResponseEntity<ApiResponse<PostResponse>> createChartOfAccount(
            @Valid @RequestBody RequestWrapper<ChartOfAccountRequest> requestWrapper,
            @RequestParam(required = false) UUID companyId) {

        log.info("Create chart of account request received for companyId: {}", companyId);

        PostResponse response = chartOfAccountService.createChartOfAccount(requestWrapper, companyId);
        return ResponseEntity.ok(ApiResponse.success(response, "Account created successfully"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get chart of account", description = "Retrieve a single chart of account by id")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Account retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied or company mismatch"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Chart of account not found")
    })
    public ResponseEntity<ApiResponse<ChartOfAccountProfileResponse>> getChartOfAccountById(
            @PathVariable UUID id) {

        log.info("Get chart of account profile by id request received for id: {}", id);
        ChartOfAccountProfileResponse response = chartOfAccountService.getChartOfAccountById(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Account profile retrieved successfully"));
    }

    @GetMapping
    @Operation(summary = "List chart of accounts", description = "Retrieve chart of accounts for the current tenant company")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Accounts retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied or company mismatch")
    })
    public ResponseEntity<ApiResponse<ChartOfAccountListResponse>> getAllChartOfAccounts(
            @ModelAttribute ChartOfAccountFilterDto filter,
            @RequestParam(required = false) String groupCode,
            @RequestParam(required = false) String categoryCode,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir) {

        if (filter == null) {
            filter = new ChartOfAccountFilterDto();
        }
        if (groupCode != null && !groupCode.isBlank()) {
            filter.setGroupCode(groupCode);
        }
        if (categoryCode != null && !categoryCode.isBlank()) {
            filter.setCategoryCode(categoryCode);
        }

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, resolvedSortBy));

        ChartOfAccountListResponse response = chartOfAccountService.getAllChartOfAccounts(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response, "Accounts retrieved successfully"));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update chart of account", description = "Update a chart of account for the current tenant company")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Account updated successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Invalid request payload"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied or company mismatch"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Chart of account not found")
    })
    public ResponseEntity<ApiResponse<PostResponse>> updateChartOfAccount(
            @PathVariable UUID id,
            @Valid @RequestBody RequestWrapper<ChartOfAccountRequest> requestWrapper) {

        log.info("Update chart of account request received for id: {}", id);
        PostResponse response = chartOfAccountService.updateChartOfAccount(id, requestWrapper);
        return ResponseEntity.ok(ApiResponse.success(response, "Account updated successfully"));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete chart of account", description = "Soft delete a chart of account for the current tenant company")
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Account deleted successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Access denied or company mismatch"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Chart of account not found")
    })
    public ResponseEntity<ApiResponse<PostResponse>> deleteChartOfAccount(
            @PathVariable UUID id) {

        log.info("Delete chart of account request received for id: {}", id);
        PostResponse response = chartOfAccountService.deleteChartOfAccount(id);
        return ResponseEntity.ok(ApiResponse.success(response, "Account deleted successfully"));
    }
}
