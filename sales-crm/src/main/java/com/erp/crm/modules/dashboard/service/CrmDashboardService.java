package com.erp.crm.modules.dashboard.service;

import com.erp.crm.modules.dashboard.dto.CrmDashboardSummaryResponse;

import java.util.UUID;

public interface CrmDashboardService {
    CrmDashboardSummaryResponse getDashboardSummary(UUID requestCompanyId);
}

