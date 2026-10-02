package com.erp.auth_service.controller.platform;

import com.erp.auth_service.dto.platform.PlatformDashboardResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.service.platform.PlatformDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sso/admin")
@RequiredArgsConstructor
public class PlatformDashboardController {

    private final PlatformDashboardService platformDashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<ResponseWrapper<PlatformDashboardResponse>> getDashboard() {
        return ResponseEntity.ok(ResponseWrapper.success(platformDashboardService.getDashboardMetrics()));
    }
}
