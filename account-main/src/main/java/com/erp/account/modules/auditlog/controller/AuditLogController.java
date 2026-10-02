package com.erp.account.modules.auditlog.controller;

import com.erp.account.common.dto.response.ApiResponse;
import com.erp.account.modules.auditlog.dto.request.AuditLogFilterDto;
import com.erp.account.modules.auditlog.dto.response.AuditLogResponse;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.util.TenantUtils;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/account/audit-logs")
@RequiredArgsConstructor
@Slf4j
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    public ApiResponse<java.util.List<AuditLogResponse>> searchAuditLogs(
            @ModelAttribute AuditLogFilterDto filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false, defaultValue = "desc") String sortDir,
            @RequestParam(required = false) UUID companyId) {

        log.info("Searching audit logs with pagination");

        Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String resolvedSortBy = sortBy != null && !sortBy.isBlank() ? sortBy : "performedAt";
        Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by(direction, resolvedSortBy));

        Page<AuditLogResponse> responsePage = auditLogService.searchAuditLogs(filter, pageable, companyId);
        return ApiResponse.paginated(responsePage, "Audit logs retrieved successfully");
    }
}
