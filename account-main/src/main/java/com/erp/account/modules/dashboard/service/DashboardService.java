package com.erp.account.modules.dashboard.service;

import com.erp.account.modules.dashboard.dto.response.DashboardResponse;
import com.erp.account.modules.dashboard.dto.response.DashboardWidget;

import java.util.List;
import java.util.UUID;

public interface DashboardService {

    DashboardResponse getDashboard(UUID companyId);

    List<DashboardWidget> getCards(UUID companyId);

    List<DashboardWidget> getCharts(UUID companyId);

    List<DashboardWidget> getNavigation(UUID companyId);

    List<DashboardWidget> getActivities(UUID companyId);

    List<DashboardWidget> getAlerts(UUID companyId);

    List<DashboardWidget> getApprovals(UUID companyId);
    
    List<DashboardWidget> getQuickActions(UUID companyId);
}
