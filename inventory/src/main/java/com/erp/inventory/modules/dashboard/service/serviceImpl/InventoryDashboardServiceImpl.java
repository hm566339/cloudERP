package com.erp.inventory.modules.dashboard.service.serviceImpl;

import com.erp.inventory.modules.dashboard.dto.InventoryDashboardResponse;
import com.erp.inventory.modules.dashboard.dto.MetricDto;
import com.erp.inventory.modules.dashboard.service.InventoryDashboardService;
import com.erp.inventory.modules.product.repository.ProductRepository;
import com.erp.inventory.modules.stock.repository.InventoryStockRepository;
import com.erp.inventory.modules.warehouse.repository.WarehouseRepository;
import com.erp.inventory.modules.transfer.repository.StockTransferRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import com.erp.inventory.common.util.TenantUtils;

@Service
@RequiredArgsConstructor
public class InventoryDashboardServiceImpl implements InventoryDashboardService {

    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final StockTransferRepository stockTransferRepository;

    @Override
    @Transactional(readOnly = true)
    public InventoryDashboardResponse getDashboardMetrics(UUID companyId, String role) {
        UUID company = TenantUtils.resolveCompanyId(companyId);
        String normalizedRole = (role != null) ? role.toUpperCase() : "EMPLOYEE";
        
        List<MetricDto> metrics = new ArrayList<>();
        List<MetricDto> alerts = new ArrayList<>();
        Map<String, Object> summary = new HashMap<>();

        // Common Metrics
        long totalProducts = productRepository.countByCompanyId(company);
        long totalWarehouses = warehouseRepository.countByCompanyId(company);
        
        summary.put("totalProducts", totalProducts);
        summary.put("totalWarehouses", totalWarehouses);

        if ("SUPER_ADMIN".equals(normalizedRole) || "COMPANY_ADMIN".equals(normalizedRole)) {
            // Admin Metrics
            metrics.add(new MetricDto("Total Products", totalProducts, "count", "boxes"));
            metrics.add(new MetricDto("Total Warehouses", totalWarehouses, "count", "building"));
            
            // Calculate total stock value roughly by sum(quantity * averageCost) 
            // For real system, use InventoryValuation or a custom JPQL query.
            BigDecimal totalStockValue = inventoryStockRepository.findAllByCompanyId(company).stream()
                .map(stock -> stock.getStockValue() != null ? stock.getStockValue() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            metrics.add(new MetricDto("Total Stock Value", totalStockValue, "currency", "money"));
            
        } else {
            // Operational Metrics for WAREHOUSE_MANAGER, EMPLOYEE
            metrics.add(new MetricDto("My Products", totalProducts, "count", "boxes"));
            
            long pendingTransfers = stockTransferRepository.countByCompanyIdAndStatus(company, "PENDING");
            alerts.add(new MetricDto("Pending Transfers", pendingTransfers, "alert", "truck"));
            
            // Low stock dummy
            long lowStockItems = 0; // Requires a custom query based on product.reorderLevel
            alerts.add(new MetricDto("Low Stock Items", lowStockItems, "warning", "exclamation-triangle"));
        }

        return InventoryDashboardResponse.builder()
                .role(normalizedRole)
                .summary(summary)
                .metrics(metrics)
                .alerts(alerts)
                .build();
    }
}
