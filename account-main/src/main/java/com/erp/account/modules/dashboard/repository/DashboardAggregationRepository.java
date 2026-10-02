package com.erp.account.modules.dashboard.repository;

import com.erp.account.modules.dashboard.dto.projections.ChartDataProjection;
import com.erp.account.modules.dashboard.dto.projections.CountAmountProjection;
import com.erp.account.modules.dashboard.dto.response.DashboardWidget;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface DashboardAggregationRepository {
    Long countCustomers(UUID companyId);
    Long countVendors(UUID companyId);
    Long countSalesInvoices(UUID companyId);
    Long countPurchaseInvoices(UUID companyId);
    
    BigDecimal getOutstandingReceivables(UUID companyId);
    BigDecimal getOutstandingPayables(UUID companyId);
    
    BigDecimal getCashBalance(UUID companyId);
    BigDecimal getBankBalance(UUID companyId);
    
    BigDecimal getRevenue(UUID companyId);
    BigDecimal getExpense(UUID companyId);
    
    BigDecimal getTodaysCollection(UUID companyId);
    BigDecimal getTodaysPayment(UUID companyId);
    
    BigDecimal getGstLiability(UUID companyId);
    BigDecimal getBudgetUtilization(UUID companyId);
    
    Long getPostedJournalsCount(UUID companyId);
    Long getPendingApprovalsCount(UUID companyId);
    
    // Charts
    List<ChartDataProjection> getRevenueTrend(UUID companyId);
    List<ChartDataProjection> getExpenseTrend(UUID companyId);
    List<ChartDataProjection> getCashFlow(UUID companyId);
    List<ChartDataProjection> getReceivableAging(UUID companyId);
    List<ChartDataProjection> getPayableAging(UUID companyId);

    // Alerts and Activities (returning raw objects or widgets)
    List<Object> getRecentActivities(UUID companyId, int limit);
    List<Object> getRecentJournals(UUID companyId, int limit);
    List<Object> getPendingApprovals(UUID companyId, int limit);
}
