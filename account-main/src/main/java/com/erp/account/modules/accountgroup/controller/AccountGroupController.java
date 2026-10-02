package com.erp.account.modules.accountgroup.controller;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ModelAttribute;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.erp.account.modules.accountgroup.dto.response.AccountGroupResponse;
import com.erp.account.modules.accountgroup.dto.response.AccountGroupResponseList;
import com.erp.account.common.dto.request.RequestWrapper;
import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.common.dto.response.PostResponse;
import com.erp.account.modules.accountgroup.dto.request.AccountGroupFilterDto;
import com.erp.account.modules.accountgroup.dto.request.AccountGroupRequest;
import com.erp.account.util.TenantUtils;
import com.erp.account.modules.accountgroup.service.AccountGroupService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/account/account-groups")
@Slf4j
@RequiredArgsConstructor
public class AccountGroupController {

        private final AccountGroupService accountGroupService;

        @PostMapping
        public ResponseEntity<ApiResponse<PostResponse>> createAccountGroup(
                        @Valid @RequestBody RequestWrapper<AccountGroupRequest> requestWrapper,
                        @RequestParam(required = false) UUID companyId) {

                log.info(
                                "Create account group request received for companyId: {}",
                                companyId);

                PostResponse response = accountGroupService.createAccountGroup(
                                requestWrapper,
                                companyId);
                return ResponseEntity.ok(ApiResponse.success(response, "Account group created successfully"));
        }

        @PutMapping("/{accountGroupId}")
        public ResponseEntity<ApiResponse<PostResponse>> updateAccountGroup(
                        @PathVariable UUID accountGroupId,
                        @Valid @RequestBody RequestWrapper<AccountGroupRequest> requestWrapper) {

                log.info(
                                "Update account group request received for accountGroupId: {}",
                                accountGroupId);

                PostResponse response = accountGroupService.updateAccountGroup(
                                accountGroupId,
                                requestWrapper);
                return ResponseEntity.ok(ApiResponse.success(response, "Account group updated successfully"));
        }

        @DeleteMapping("/{accountGroupId}")
        public ResponseEntity<ApiResponse<PostResponse>> deleteAccountGroup(
                        @PathVariable UUID accountGroupId) {

                log.info(
                                "Delete account group request received for accountGroupId: {}",
                                accountGroupId);

                PostResponse response = accountGroupService.deleteAccountGroup(
                                accountGroupId);
                return ResponseEntity.ok(ApiResponse.success(response, "Account group deleted successfully"));
        }

        @PatchMapping("/{accountGroupId}/restore")
        public ResponseEntity<ApiResponse<PostResponse>> restoreAccountGroup(
                        @PathVariable UUID accountGroupId) {

                log.info(
                                "Restore account group request received for accountGroupId: {}",
                                accountGroupId);

                PostResponse response = accountGroupService.restoreAccountGroup(
                                accountGroupId);
                return ResponseEntity.ok(ApiResponse.success(response, "Account group restored successfully"));
        }

        @GetMapping("/{accountGroupId}")
        @io.swagger.v3.oas.annotations.Operation(summary = "Get account group by ID with full profile")
        public ResponseEntity<ApiResponse<com.erp.account.modules.accountgroup.dto.response.AccountGroupProfileResponse>> getAccountGroupById(
                        @PathVariable UUID accountGroupId) {

                log.info(
                                "Get account group by id request received for accountGroupId: {}",
                                accountGroupId);

                com.erp.account.modules.accountgroup.dto.response.AccountGroupProfileResponse response = accountGroupService.getAccountGroupById(accountGroupId);
                return ResponseEntity.ok(ApiResponse.success(response, "Account group retrieved successfully"));
        }

        @GetMapping
        public ResponseEntity<ApiResponse<AccountGroupResponseList>> getAllAccountGroups(
                        @ModelAttribute AccountGroupFilterDto filter,
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(name = "size", defaultValue = "10") int size,
                        @RequestParam(required = false) String sortBy,
                        @RequestParam(required = false, defaultValue = "desc") String sortDir) {

                Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
                String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "createdAt";
                Pageable pageable = PageRequest.of(page, size, Sort.by(direction, resolvedSortBy));

                AccountGroupResponseList response = accountGroupService.getAllAccountGroups(filter, pageable);
                return ResponseEntity.ok(ApiResponse.success(response, "Account groups retrieved successfully"));
        }
}
