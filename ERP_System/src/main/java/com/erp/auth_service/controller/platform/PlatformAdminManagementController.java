package com.erp.auth_service.controller.platform;

import com.erp.auth_service.dto.platform.*;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.service.platform.PlatformAdminManagementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/platform/admins")
@RequiredArgsConstructor
public class PlatformAdminManagementController {

    private final PlatformAdminManagementService platformAdminManagementService;

    @GetMapping
    public ResponseEntity<ResponseWrapper<List<PlatformAdminResponse>>> listAdmins() {
        return ResponseEntity.ok(ResponseWrapper.success(platformAdminManagementService.listAdmins()));
    }

    @PostMapping
    public ResponseEntity<ResponseWrapper<PlatformAdminResponse>> createAdmin(
            @Valid @RequestBody CreatePlatformAdminRequest request,
            HttpServletRequest httpServletRequest) {

        UUID adminId = PlatformSecurityUtil.getCurrentAdminId();
        String ip = getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        PlatformAdminResponse response = platformAdminManagementService.createAdmin(request, adminId, ip, userAgent);
        return ResponseEntity.ok(ResponseWrapper.success("Admin created successfully", response));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ResponseWrapper<PlatformAdminResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePlatformAdminStatusRequest request,
            HttpServletRequest httpServletRequest) {

        UUID adminId = PlatformSecurityUtil.getCurrentAdminId();
        String ip = getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        PlatformAdminResponse response = platformAdminManagementService.updateStatus(id, request, adminId, ip,
                userAgent);
        return ResponseEntity.ok(ResponseWrapper.success("Admin status updated", response));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ResponseWrapper<PlatformAdminResponse>> updateRoles(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePlatformAdminRoleRequest request,
            HttpServletRequest httpServletRequest) {

        UUID adminId = PlatformSecurityUtil.getCurrentAdminId();
        String ip = getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        PlatformAdminResponse response = platformAdminManagementService.updateRoles(id, request, adminId, ip,
                userAgent);
        return ResponseEntity.ok(ResponseWrapper.success("Admin roles updated", response));
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
