package com.erp.account.modules.expense.service.impl;

import com.erp.account.modules.expense.dto.report.*;
import com.erp.account.modules.expense.repository.report.ExpenseReportRepository;
import com.erp.account.modules.expense.service.ExpenseReportService;
import com.erp.account.util.TenantUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseReportServiceImpl implements ExpenseReportService {

    private final ExpenseReportRepository expenseReportRepository;

    @Override
    @Transactional(readOnly = true)
    public ExpenseReportSummaryResponse getSummary(UUID companyId, ExpenseReportFilterRequest filter) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Generating expense report summary for company {}", resolvedCompanyId);
        return expenseReportRepository.getSummary(resolvedCompanyId, filter);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffDriverReportResponse> getStaffDriverAnalysis(UUID companyId, ExpenseReportFilterRequest filter) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Generating staff/driver analysis for company {}", resolvedCompanyId);
        // If employeeName lookup is required, it should be mapped here
        // For now, we return the data from repository directly (which has employeeId)
        return expenseReportRepository.getStaffDriverAnalysis(resolvedCompanyId, filter);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryExpenseReportResponse> getCategoryBreakdown(UUID companyId, ExpenseReportFilterRequest filter) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Generating category breakdown for company {}", resolvedCompanyId);
        return expenseReportRepository.getCategoryBreakdown(resolvedCompanyId, filter);
    }

    @Override
    @Transactional(readOnly = true)
    public List<VehicleExpenseReportResponse> getVehicleFleetExpenses(UUID companyId,
            ExpenseReportFilterRequest filter) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Generating vehicle fleet expenses for company {}", resolvedCompanyId);
        return expenseReportRepository.getVehicleFleetExpenses(resolvedCompanyId, filter);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesOrderDcExpenseReportResponse> getSalesOrderDcExpenses(UUID companyId,
            ExpenseReportFilterRequest filter) {
        UUID resolvedCompanyId = TenantUtils.resolveCompanyId(companyId);
        log.info("Generating sales order/DC expenses for company {}", resolvedCompanyId);
        return expenseReportRepository.getSalesOrderDcExpenses(resolvedCompanyId, filter);
    }

}
