package com.erp.inventory.modules.dashboard.service;

import com.erp.inventory.modules.dashboard.dto.InventoryDashboardResponse;
import java.util.UUID;

public interface InventoryDashboardService {
    InventoryDashboardResponse getDashboardMetrics(UUID companyId, String role);
}
