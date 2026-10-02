package com.erp.account.modules.expense.service;

import com.erp.account.modules.expense.dto.report.*;

import java.util.List;
import java.util.UUID;

public interface ExpenseReportService {
    
    ExpenseReportSummaryResponse getSummary(UUID companyId, ExpenseReportFilterRequest filter);
    
    List<StaffDriverReportResponse> getStaffDriverAnalysis(UUID companyId, ExpenseReportFilterRequest filter);
    
    List<CategoryExpenseReportResponse> getCategoryBreakdown(UUID companyId, ExpenseReportFilterRequest filter);
    
    List<VehicleExpenseReportResponse> getVehicleFleetExpenses(UUID companyId, ExpenseReportFilterRequest filter);
    
    List<SalesOrderDcExpenseReportResponse> getSalesOrderDcExpenses(UUID companyId, ExpenseReportFilterRequest filter);
}
