package com.erp.auth_service.controller;

import com.erp.auth_service.dto.response.DashboardResponse;
import com.erp.auth_service.dto.response.ResponseWrapper;
import com.erp.auth_service.service.DashboardService;

import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/sso/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    /*
     * COMPANY DASHBOARD
     */
    @GetMapping("/{companyId}")
    public ResponseEntity<ResponseWrapper<DashboardResponse>> getDashboard(
            @PathVariable UUID companyId
    ) {

        return ResponseEntity.ok(
                ResponseWrapper.success(dashboardService.getDashboard(companyId))
        );
    }
}