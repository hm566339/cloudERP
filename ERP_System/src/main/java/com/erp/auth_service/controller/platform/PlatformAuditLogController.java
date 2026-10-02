package com.erp.auth_service.controller.platform;

import com.erp.auth_service.dto.platform.PlatformAuditLogResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.service.platform.PlatformAuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sso/admin/audit-logs")
@RequiredArgsConstructor
public class PlatformAuditLogController {

    private final PlatformAuditService platformAuditService;

    @GetMapping
    public ResponseEntity<ResponseWrapper<Page<PlatformAuditLogResponse>>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(ResponseWrapper.success(
                platformAuditService.getAuditLogs(PageRequest.of(page, size))));
    }
}
