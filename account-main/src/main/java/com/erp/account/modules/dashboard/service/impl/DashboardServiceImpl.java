package com.erp.account.modules.dashboard.service.impl;

import com.erp.account.modules.dashboard.dto.response.DashboardResponse;
import com.erp.account.modules.dashboard.dto.response.DashboardWidget;
import com.erp.account.modules.dashboard.repository.DashboardAggregationRepository;
import com.erp.account.modules.dashboard.service.DashboardService;
import com.erp.account.modules.dashboard.util.WidgetBuilder;
import com.erp.account.security.CurrentUserContext;
import com.erp.account.security.authorization.SsoAuthorities;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.erp.account.modules.reporting.service.CashFlowReportService;
import com.erp.account.modules.reporting.dto.request.CashFlowRequest;
import com.erp.account.modules.reporting.dto.response.CashFlowReportResponse;
import com.erp.account.modules.dashboard.dto.response.ChartDataDto;
import com.erp.account.modules.dashboard.dto.projections.ChartDataProjection;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DashboardAggregationRepository dashboardAggregationRepository;
    private final CashFlowReportService cashFlowReportService;

    @Override
    public DashboardResponse getDashboard(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);

        return DashboardResponse.builder()
                .cards(getCards(resolvedCompanyId))
                .charts(getCharts(resolvedCompanyId))
                .alerts(getAlerts(resolvedCompanyId))
                .activities(getActivities(resolvedCompanyId))
                .quickActions(getQuickActions(resolvedCompanyId))
                .approvals(getApprovals(resolvedCompanyId))
                .navigation(getNavigation(resolvedCompanyId))
                .build();
    }

    @Override
    public List<DashboardWidget> getCards(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        List<DashboardWidget> widgets = new ArrayList<>();

        // Revenue & Expense â€” module=DASHBOARD so all dashboard-authorized users see them
        widgets.add(WidgetBuilder.buildCard("revenue", "Revenue", "pi pi-chart-line", 1, "READ", "DASHBOARD", safeGetRevenue(resolvedCompanyId)));
        widgets.add(WidgetBuilder.buildCard("expense", "Expenses", "pi pi-chart-bar", 2, "READ", "DASHBOARD", safeGetExpense(resolvedCompanyId)));

        // Outstanding
        widgets.add(WidgetBuilder.buildCard("outstanding-rec", "Receivables", "pi pi-arrow-right", 3, "READ", "DASHBOARD", safeGetOutstandingReceivables(resolvedCompanyId)));
        widgets.add(WidgetBuilder.buildCard("outstanding-pay", "Payables", "pi pi-arrow-left", 4, "READ", "DASHBOARD", safeGetOutstandingPayables(resolvedCompanyId)));

        // Counts
        widgets.add(WidgetBuilder.buildCard("sales-invoices", "Sales Invoices", "pi pi-file-export", 5, "READ", "DASHBOARD", safeCountSalesInvoices(resolvedCompanyId)));
        widgets.add(WidgetBuilder.buildCard("purchase-invoices", "Purchase Invoices", "pi pi-file-import", 6, "READ", "DASHBOARD", safeCountPurchaseInvoices(resolvedCompanyId)));
        widgets.add(WidgetBuilder.buildCard("posted-journals", "Posted Journals", "pi pi-book", 7, "READ", "DASHBOARD", safeGetPostedJournalsCount(resolvedCompanyId)));
        widgets.add(WidgetBuilder.buildCard("active-users", "Customers", "pi pi-users", 8, "READ", "DASHBOARD", safeCountCustomers(resolvedCompanyId)));
        widgets.add(WidgetBuilder.buildCard("vendors", "Vendors", "pi pi-truck", 9, "READ", "DASHBOARD", safeCountVendors(resolvedCompanyId)));

        // Static
        widgets.add(WidgetBuilder.buildCard("sys-health", "System Health", "pi pi-heart-fill", 10, "READ", "DASHBOARD", "100%"));
        widgets.add(WidgetBuilder.buildCard("pending-approvals", "Pending Approvals", "pi pi-check-circle", 11, "READ", "DASHBOARD", safeGetPendingApprovalsCount(resolvedCompanyId)));

        // Cash & Bank balances
        widgets.add(WidgetBuilder.buildCard("cash-balance", "Cash Balance", "pi pi-money-bill", 12, "READ", "DASHBOARD", safeGetCashBalance(resolvedCompanyId)));
        widgets.add(WidgetBuilder.buildCard("bank-balance", "Bank Balance", "pi pi-building", 13, "READ", "DASHBOARD", safeGetBankBalance(resolvedCompanyId)));

        // Today's totals
        widgets.add(WidgetBuilder.buildCard("todays-collection", "Today's Collection", "pi pi-download", 14, "READ", "DASHBOARD", safeGetTodaysCollection(resolvedCompanyId)));
        widgets.add(WidgetBuilder.buildCard("todays-payment", "Today's Payment", "pi pi-upload", 15, "READ", "DASHBOARD", safeGetTodaysPayment(resolvedCompanyId)));

        // GST
        widgets.add(WidgetBuilder.buildCard("gst-liability", "GST Liability", "pi pi-percentage", 16, "READ", "DASHBOARD", safeGetGstLiability(resolvedCompanyId)));

        return filterAndSortWidgets(widgets);
    }

    @Override
    public List<DashboardWidget> getCharts(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        List<DashboardWidget> widgets = new ArrayList<>();

        // Chart widgets â€” data from repository (currently returns empty lists, can be expanded later)
        widgets.add(WidgetBuilder.buildChart("revenue-trend", "Revenue Trend", "pi pi-chart-line", 1, "READ", "DASHBOARD", dashboardAggregationRepository.getRevenueTrend(resolvedCompanyId)));
        widgets.add(WidgetBuilder.buildChart("expense-trend", "Expense Trend", "pi pi-chart-bar", 2, "READ", "DASHBOARD", dashboardAggregationRepository.getExpenseTrend(resolvedCompanyId)));
        
        // Fetch Cash Flow from actual CashFlowReportService
        widgets.add(WidgetBuilder.buildChart("cash-flow", "Cash Flow", "pi pi-wallet", 3, "READ", "DASHBOARD", getCashFlowChartData(resolvedCompanyId)));
        
        widgets.add(WidgetBuilder.buildChart("receivable-aging", "Receivable Aging", "pi pi-clock", 4, "READ", "DASHBOARD", dashboardAggregationRepository.getReceivableAging(resolvedCompanyId)));
        widgets.add(WidgetBuilder.buildChart("payable-aging", "Payable Aging", "pi pi-clock", 5, "READ", "DASHBOARD", dashboardAggregationRepository.getPayableAging(resolvedCompanyId)));

        return filterAndSortWidgets(widgets);
    }

    private List<ChartDataProjection> getCashFlowChartData(UUID companyId) {
        try {
            CashFlowRequest request = new CashFlowRequest();
            request.setCompanyId(companyId);
            CashFlowReportResponse response = cashFlowReportService.getCashFlowReport(request);
            
            BigDecimal inflow = response.getOpeningClosingBalance().getTotalCashInflow();
            BigDecimal outflow = response.getOpeningClosingBalance().getTotalCashOutflow();
            BigDecimal netFlow = response.getOpeningClosingBalance().getNetCashFlow();

            List<ChartDataProjection> chartData = new ArrayList<>();
            chartData.add(new ChartDataDto("Cash Inflow", inflow != null ? inflow : BigDecimal.ZERO));
            chartData.add(new ChartDataDto("Cash Outflow", outflow != null ? outflow : BigDecimal.ZERO));
            chartData.add(new ChartDataDto("Net Cash Flow", netFlow != null ? netFlow : BigDecimal.ZERO));
            return chartData;
        } catch (Exception e) {
            log.warn("Error fetching cash flow report data for chart: {}", e.getMessage());
            List<ChartDataProjection> emptyData = new ArrayList<>();
            emptyData.add(new ChartDataDto("Cash Inflow", BigDecimal.ZERO));
            emptyData.add(new ChartDataDto("Cash Outflow", BigDecimal.ZERO));
            emptyData.add(new ChartDataDto("Net Cash Flow", BigDecimal.ZERO));
            return emptyData;
        }
    }

    @Override
    public List<DashboardWidget> getNavigation(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        List<DashboardWidget> nav = new ArrayList<>();

        nav.add(WidgetBuilder.buildNavigation("nav-revenue", "Revenue Management", "pi pi-dollar", 1, "READ", "DASHBOARD", "/finance/revenue"));
        nav.add(WidgetBuilder.buildNavigation("nav-expense", "Expense Management", "pi pi-wallet", 2, "READ", "DASHBOARD", "/finance/expense"));
        nav.add(WidgetBuilder.buildNavigation("nav-sales", "Sales Invoices", "pi pi-file", 3, "READ", "DASHBOARD", "/sales"));
        nav.add(WidgetBuilder.buildNavigation("nav-purchases", "Purchase Invoices", "pi pi-file", 4, "READ", "DASHBOARD", "/purchases"));
        nav.add(WidgetBuilder.buildNavigation("nav-journal", "Journal Posting", "pi pi-pencil", 5, "READ", "DASHBOARD", "/accounting/journals"));
        nav.add(WidgetBuilder.buildNavigation("nav-ledger", "Ledger Summary", "pi pi-list", 6, "READ", "DASHBOARD", "/accounting/ledger"));
        nav.add(WidgetBuilder.buildNavigation("nav-trial", "Trial Balance", "pi pi-table", 7, "READ", "DASHBOARD", "/accounting/reports/trial-balance"));
        nav.add(WidgetBuilder.buildNavigation("nav-settings", "System Settings", "pi pi-cog", 8, "READ", "DASHBOARD", "/settings"));
        nav.add(WidgetBuilder.buildNavigation("nav-users", "User Management", "pi pi-user-edit", 9, "READ", "DASHBOARD", "/users"));
        nav.add(WidgetBuilder.buildNavigation("nav-logs", "Audit Logs", "pi pi-list", 10, "READ", "DASHBOARD", "/logs"));

        return filterAndSortWidgets(nav);
    }

    @Override
    public List<DashboardWidget> getActivities(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        List<DashboardWidget> widgets = new ArrayList<>();

        widgets.add(WidgetBuilder.buildActivity("recent-activities", "Recent Activities", "pi pi-history", 1, "READ", "DASHBOARD",
                dashboardAggregationRepository.getRecentActivities(resolvedCompanyId, 10)));
        widgets.add(WidgetBuilder.buildActivity("recent-journals", "Recent Journal Entries", "pi pi-book", 2, "READ", "DASHBOARD",
                dashboardAggregationRepository.getRecentJournals(resolvedCompanyId, 10)));

        return filterAndSortWidgets(widgets);
    }

    @Override
    public List<DashboardWidget> getAlerts(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        List<DashboardWidget> widgets = new ArrayList<>();

        // Build alerts based on actual data thresholds with full null safety
        BigDecimal receivables = safeGetOutstandingReceivables(resolvedCompanyId);
        if (receivables == null) receivables = BigDecimal.ZERO;
        BigDecimal payables = safeGetOutstandingPayables(resolvedCompanyId);
        if (payables == null) payables = BigDecimal.ZERO;
        BigDecimal gstLiability = safeGetGstLiability(resolvedCompanyId);
        if (gstLiability == null) gstLiability = BigDecimal.ZERO;
        BigDecimal cashBalance = safeGetCashBalance(resolvedCompanyId);
        if (cashBalance == null) cashBalance = BigDecimal.ZERO;

        Map<String, Object> receivablesData = new HashMap<>();
        receivablesData.put("amount", receivables);
        receivablesData.put("severity", receivables.compareTo(BigDecimal.ZERO) > 0 ? "warning" : "info");
        widgets.add(WidgetBuilder.buildAlert("overdue-receivables", "Outstanding Receivables", "pi pi-exclamation-triangle", 1, "READ", "DASHBOARD", receivablesData));

        Map<String, Object> payablesData = new HashMap<>();
        payablesData.put("amount", payables);
        payablesData.put("severity", payables.compareTo(BigDecimal.ZERO) > 0 ? "warning" : "info");
        widgets.add(WidgetBuilder.buildAlert("overdue-payables", "Outstanding Payables", "pi pi-exclamation-circle", 2, "READ", "DASHBOARD", payablesData));

        Map<String, Object> gstData = new HashMap<>();
        gstData.put("amount", gstLiability);
        gstData.put("severity", gstLiability.compareTo(BigDecimal.ZERO) > 0 ? "info" : "success");
        widgets.add(WidgetBuilder.buildAlert("gst-liability-alert", "GST Liability", "pi pi-percentage", 3, "READ", "DASHBOARD", gstData));

        Map<String, Object> cashData = new HashMap<>();
        cashData.put("amount", cashBalance);
        cashData.put("severity", cashBalance.compareTo(new BigDecimal("10000")) < 0 ? "danger" : "success");
        widgets.add(WidgetBuilder.buildAlert("low-cash-balance", "Cash Balance Status", "pi pi-money-bill", 4, "READ", "DASHBOARD", cashData));

        return filterAndSortWidgets(widgets);
    }

    @Override
    public List<DashboardWidget> getApprovals(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        List<DashboardWidget> widgets = new ArrayList<>();

        Long pendingCount = safeGetPendingApprovalsCount(resolvedCompanyId);
        Map<String, Object> approvalData = new HashMap<>();
        approvalData.put("count", pendingCount);
        approvalData.put("items", dashboardAggregationRepository.getPendingApprovals(resolvedCompanyId, 10));

        widgets.add(WidgetBuilder.buildApproval("pending-approvals-list", "Pending Approvals", "pi pi-check-circle", 1, "READ", "DASHBOARD", approvalData));

        return filterAndSortWidgets(widgets);
    }

    @Override
    public List<DashboardWidget> getQuickActions(UUID companyId) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyIdForQuery(companyId);
        List<DashboardWidget> widgets = new ArrayList<>();

        widgets.add(WidgetBuilder.buildQuickAction("qa-create-sales-invoice", "Create Sales Invoice", "pi pi-file-export", 1, "CREATE", "DASHBOARD", "/sales/invoices/new"));
        widgets.add(WidgetBuilder.buildQuickAction("qa-create-purchase-invoice", "Create Purchase Invoice", "pi pi-file-import", 2, "CREATE", "DASHBOARD", "/purchases/invoices/new"));
        widgets.add(WidgetBuilder.buildQuickAction("qa-post-journal", "Post Journal Entry", "pi pi-pencil", 3, "CREATE", "DASHBOARD", "/accounting/journals/new"));
        widgets.add(WidgetBuilder.buildQuickAction("qa-create-customer", "Create Customer", "pi pi-user-plus", 4, "CREATE", "DASHBOARD", "/customers/new"));
        widgets.add(WidgetBuilder.buildQuickAction("qa-create-vendor", "Create Vendor", "pi pi-truck", 5, "CREATE", "DASHBOARD", "/vendors/new"));
        widgets.add(WidgetBuilder.buildQuickAction("qa-record-receipt", "Record Receipt", "pi pi-download", 6, "CREATE", "DASHBOARD", "/receipts/new"));
        widgets.add(WidgetBuilder.buildQuickAction("qa-record-payment", "Record Payment", "pi pi-upload", 7, "CREATE", "DASHBOARD", "/payments/new"));
        widgets.add(WidgetBuilder.buildQuickAction("qa-view-reports", "View Reports", "pi pi-chart-bar", 8, "READ", "DASHBOARD", "/reports"));

        return filterAndSortWidgets(widgets);
    }

    // ========== Safe Data Fetchers (catch exceptions, return defaults) ==========

    private BigDecimal safeGetRevenue(UUID companyId) {
        try { BigDecimal val = dashboardAggregationRepository.getRevenue(companyId); return val != null ? val : BigDecimal.ZERO; } catch (Exception e) { log.warn("Error fetching revenue: {}", e.getMessage()); return BigDecimal.ZERO; }
    }

    private BigDecimal safeGetExpense(UUID companyId) {
        try { BigDecimal val = dashboardAggregationRepository.getExpense(companyId); return val != null ? val : BigDecimal.ZERO; } catch (Exception e) { log.warn("Error fetching expense: {}", e.getMessage()); return BigDecimal.ZERO; }
    }

    private BigDecimal safeGetOutstandingReceivables(UUID companyId) {
        try { BigDecimal val = dashboardAggregationRepository.getOutstandingReceivables(companyId); return val != null ? val : BigDecimal.ZERO; } catch (Exception e) { log.warn("Error fetching receivables: {}", e.getMessage()); return BigDecimal.ZERO; }
    }

    private BigDecimal safeGetOutstandingPayables(UUID companyId) {
        try { BigDecimal val = dashboardAggregationRepository.getOutstandingPayables(companyId); return val != null ? val : BigDecimal.ZERO; } catch (Exception e) { log.warn("Error fetching payables: {}", e.getMessage()); return BigDecimal.ZERO; }
    }

    private Long safeCountSalesInvoices(UUID companyId) {
        try { return dashboardAggregationRepository.countSalesInvoices(companyId); } catch (Exception e) { log.warn("Error counting sales invoices: {}", e.getMessage()); return 0L; }
    }

    private Long safeCountPurchaseInvoices(UUID companyId) {
        try { return dashboardAggregationRepository.countPurchaseInvoices(companyId); } catch (Exception e) { log.warn("Error counting purchase invoices: {}", e.getMessage()); return 0L; }
    }

    private Long safeGetPostedJournalsCount(UUID companyId) {
        try { return dashboardAggregationRepository.getPostedJournalsCount(companyId); } catch (Exception e) { log.warn("Error counting posted journals: {}", e.getMessage()); return 0L; }
    }

    private Long safeCountCustomers(UUID companyId) {
        try { return dashboardAggregationRepository.countCustomers(companyId); } catch (Exception e) { log.warn("Error counting customers: {}", e.getMessage()); return 0L; }
    }

    private Long safeCountVendors(UUID companyId) {
        try { return dashboardAggregationRepository.countVendors(companyId); } catch (Exception e) { log.warn("Error counting vendors: {}", e.getMessage()); return 0L; }
    }

    private Long safeGetPendingApprovalsCount(UUID companyId) {
        try { return dashboardAggregationRepository.getPendingApprovalsCount(companyId); } catch (Exception e) { log.warn("Error counting pending approvals: {}", e.getMessage()); return 0L; }
    }

    private BigDecimal safeGetCashBalance(UUID companyId) {
        try { BigDecimal val = dashboardAggregationRepository.getCashBalance(companyId); return val != null ? val : BigDecimal.ZERO; } catch (Exception e) { log.warn("Error fetching cash balance: {}", e.getMessage()); return BigDecimal.ZERO; }
    }

    private BigDecimal safeGetBankBalance(UUID companyId) {
        try { BigDecimal val = dashboardAggregationRepository.getBankBalance(companyId); return val != null ? val : BigDecimal.ZERO; } catch (Exception e) { log.warn("Error fetching bank balance: {}", e.getMessage()); return BigDecimal.ZERO; }
    }

    private BigDecimal safeGetTodaysCollection(UUID companyId) {
        try { BigDecimal val = dashboardAggregationRepository.getTodaysCollection(companyId); return val != null ? val : BigDecimal.ZERO; } catch (Exception e) { log.warn("Error fetching today's collection: {}", e.getMessage()); return BigDecimal.ZERO; }
    }

    private BigDecimal safeGetTodaysPayment(UUID companyId) {
        try { BigDecimal val = dashboardAggregationRepository.getTodaysPayment(companyId); return val != null ? val : BigDecimal.ZERO; } catch (Exception e) { log.warn("Error fetching today's payment: {}", e.getMessage()); return BigDecimal.ZERO; }
    }

    private BigDecimal safeGetGstLiability(UUID companyId) {
        try { BigDecimal val = dashboardAggregationRepository.getGstLiability(companyId); return val != null ? val : BigDecimal.ZERO; } catch (Exception e) { log.warn("Error fetching GST liability: {}", e.getMessage()); return BigDecimal.ZERO; }
    }

    // ========== SSO / Permission Filtering ==========

    private List<DashboardWidget> filterAndSortWidgets(List<DashboardWidget> widgets) {
        if (widgets == null || widgets.isEmpty()) {
            return new ArrayList<>();
        }

        if (TenantUtils.isSystemAdmin()) {
            // SYSTEM_ADMIN: No filtering. Return every visible widget (SSO-provided role).
            return widgets.stream()
                    .filter(w -> Boolean.TRUE.equals(w.getVisible()))
                    .sorted(Comparator.comparing(w -> w.getOrder() != null ? w.getOrder() : Integer.MAX_VALUE))
                    .collect(Collectors.toList());
        }

        // Read the active+allowed permissions granted by the VERIFIED SSO response.
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getAuthorities() == null) {
            return new ArrayList<>();
        }

        List<DashboardWidget> visible = widgets.stream()
                .filter(w -> Boolean.TRUE.equals(w.getVisible()))
                .filter(w -> w.getModule() != null && w.getPermission() != null)
                .filter(w -> SsoAuthorities.hasModuleAction(authentication.getAuthorities(), w.getModule(), w.getPermission())
                        || SsoAuthorities.hasFeatureAction(authentication.getAuthorities(), w.getModule(), w.getPermission()))
                .sorted(Comparator.comparing(w -> w.getOrder() != null ? w.getOrder() : Integer.MAX_VALUE))
                .collect(Collectors.toList());

        if (visible.isEmpty()) {
            log.debug("No dashboard widgets granted by SSO authorities for user [{}]", CurrentUserContext.getUsername());
        }

        return visible;
    }
}
