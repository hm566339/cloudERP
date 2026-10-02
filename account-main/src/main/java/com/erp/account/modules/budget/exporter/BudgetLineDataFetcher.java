package com.erp.account.modules.budget.exporter;

import com.erp.account.modules.budget.dto.request.BudgetLineFilterDto;
import com.erp.account.modules.budget.dto.response.BudgetLineResponse;
import com.erp.account.modules.budget.dto.response.BudgetLineResponseList;
import com.erp.account.modules.budget.service.BudgetLineService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class BudgetLineDataFetcher implements ReportDataFetcher {

    private final BudgetLineService budgetLineService;

    @Override
    public boolean supports(String reportName) {
        return "budget-lines".equalsIgnoreCase(reportName) || "budgetlines-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        BudgetLineFilterDto filter = new BudgetLineFilterDto();
        if (request.getDateFrom() != null) {
            filter.setFromDate(request.getDateFrom());
        }
        if (request.getDateTo() != null) {
            filter.setToDate(request.getDateTo());
        }
        
        BudgetLineResponseList response = budgetLineService.searchBudgetLines(filter, PageRequest.of(0, 10000));
        
        List<String> headers = Arrays.asList("Account Code", "Account Name", "Allocated Amount", "Utilized Amount", "Actual Expense", "Remaining Amount");
        List<List<Object>> rows = new ArrayList<>();
        
        for (BudgetLineResponse line : response.getBudgetLines()) {
            List<Object> row = new ArrayList<>();
            row.add(line.getAccountCode());
            row.add(line.getAccountName());
            row.add(line.getAllocatedAmount());
            row.add(line.getUtilizedAmount());
            row.add(line.getActualExpense());
            row.add(line.getRemainingAmount());
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("Budget Lines Report")
                .headers(headers)
                .rows(rows)
                .build();
    }
}