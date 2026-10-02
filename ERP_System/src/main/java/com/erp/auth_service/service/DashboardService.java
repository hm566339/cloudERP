package com.erp.auth_service.service;

import java.util.UUID;

import com.erp.auth_service.dto.response.DashboardResponse;

public interface DashboardService {
   DashboardResponse getDashboard(UUID companyId);
}
