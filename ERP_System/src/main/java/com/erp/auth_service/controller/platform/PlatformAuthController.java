package com.erp.auth_service.controller.platform;

import com.erp.auth_service.dto.platform.PlatformAdminLoginRequest;
import com.erp.auth_service.dto.platform.PlatformAdminLoginResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.security.PlatformSecurityUtil;
import com.erp.auth_service.service.platform.PlatformAdminAuthService;
import com.erp.auth_service.service.platform.PlatformAuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sso/admin/auth")
@RequiredArgsConstructor
public class PlatformAuthController {

    private final PlatformAdminAuthService platformAdminAuthService;
    private final PlatformAuditService platformAuditService;

    @PostMapping("/login")
    public ResponseEntity<ResponseWrapper<PlatformAdminLoginResponse>> login(
            @Valid @RequestBody PlatformAdminLoginRequest request,
            HttpServletRequest httpServletRequest) {

        String ip = getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        PlatformAdminLoginResponse response = platformAdminAuthService.login(request, ip, userAgent);
        return ResponseEntity.ok(ResponseWrapper.success("Login successful", response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ResponseWrapper<Map<String, String>>> logout(
            HttpServletRequest httpServletRequest) {

        UUID adminId = PlatformSecurityUtil.getCurrentAdminId();
        String adminEmail = PlatformSecurityUtil.getCurrentAdminEmail();
        String ip = getClientIp(httpServletRequest);
        String userAgent = httpServletRequest.getHeader("User-Agent");

        platformAuditService.record(null, adminEmail, "ADMIN_LOGOUT", null, null, null, null,
                "PlatformAdmin", adminId != null ? adminId.toString() : null,
                "Admin logged out", ip, userAgent, "SUCCESS", null);

        return ResponseEntity.ok(ResponseWrapper.success(Map.of("message", "Logged out successfully")));
    }

    private String getClientIp(HttpServletRequest request) {
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
