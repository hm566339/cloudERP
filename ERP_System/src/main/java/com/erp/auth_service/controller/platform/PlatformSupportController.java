package com.erp.auth_service.controller.platform;

import com.erp.auth_service.dto.platform.*;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.service.platform.PlatformSupportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/admin/support-sessions")
@RequiredArgsConstructor
public class PlatformSupportController {

    private final PlatformSupportService platformSupportService;

    @PostMapping
    public ResponseEntity<ResponseWrapper<SupportSessionResponse>> createSession(
            @Valid @RequestBody CreateSupportSessionRequest request,
            HttpServletRequest httpServletRequest) {

        UUID adminId = PlatformSecurityUtil.getCurrentAdminId();
        String ip = getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        SupportSessionResponse response = platformSupportService.createSupportSession(adminId, request, ip, userAgent);
        return ResponseEntity.ok(ResponseWrapper.success("Support session created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ResponseWrapper<List<SupportSessionResponse>>> listSessions() {
        UUID adminId = PlatformSecurityUtil.getCurrentAdminId();
        return ResponseEntity.ok(ResponseWrapper.success(platformSupportService.listSessions(adminId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResponseWrapper<SupportSessionResponse>> getSession(@PathVariable UUID id) {
        return ResponseEntity.ok(ResponseWrapper.success(platformSupportService.getSession(id)));
    }

    @PostMapping("/{id}/revoke")
    public ResponseEntity<ResponseWrapper<SupportSessionResponse>> revokeSession(
            @PathVariable UUID id,
            @RequestBody(required = false) SupportRevokeRequest request,
            HttpServletRequest httpServletRequest) {

        UUID adminId = PlatformSecurityUtil.getCurrentAdminId();
        String reason = request != null ? request.getReason() : null;
        String ip = getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        SupportSessionResponse response = platformSupportService.revokeSupportSession(id, adminId, reason, ip,
                userAgent);
        return ResponseEntity.ok(ResponseWrapper.success("Support session revoked", response));
    }

    @GetMapping("/{id}/context")
    public ResponseEntity<ResponseWrapper<SupportSessionContextResponse>> getSessionContext(@PathVariable UUID id) {
        return ResponseEntity.ok(ResponseWrapper.success(platformSupportService.getSessionContext(id)));
    }

    @PostMapping("/{id}/mutate")
    public ResponseEntity<ResponseWrapper<Map<String, Object>>> executeMutation(
            @PathVariable UUID id,
            @Valid @RequestBody SupportMutationRequest request,
            HttpServletRequest httpServletRequest) {

        UUID adminId = PlatformSecurityUtil.getCurrentAdminId();
        String ip = getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        Map<String, Object> result = platformSupportService.executeSupportMutation(id, adminId, request, ip, userAgent);
        return ResponseEntity.ok(ResponseWrapper.success("Support mutation executed successfully", result));
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
