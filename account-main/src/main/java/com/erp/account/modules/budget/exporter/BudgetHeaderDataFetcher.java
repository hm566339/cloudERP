package com.erp.account.modules.budget.exporter;

import com.erp.account.modules.budget.dto.request.BudgetHeaderFilterDto;
import com.erp.account.modules.budget.dto.response.BudgetHeaderResponse;
import com.erp.account.modules.budget.dto.response.BudgetHeaderResponseList;
import com.erp.account.modules.budget.service.BudgetHeaderService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class BudgetHeaderDataFetcher implements ReportDataFetcher {

    private final BudgetHeaderService budgetHeaderService;

    @Override
    public boolean supports(String reportName) {
        return "budget-headers".equalsIgnoreCase(reportName) || "budgetheaders-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        BudgetHeaderFilterDto filter = new BudgetHeaderFilterDto();
        
        BudgetHeaderResponseList response = budgetHeaderService.getBudgetHeaders(filter, PageRequest.of(0, 10000));
        
        List<String> headers = Arrays.asList("Budget Name", "Fiscal Year", "Total Budget", "Allocated", "Utilized", "Remaining");
        List<List<Object>> rows = new ArrayList<>();
        
        for (BudgetHeaderResponse header : response.getBudgetHeaders()) {
            List<Object> row = new ArrayList<>();
            row.add(header.getBudgetName());
            row.add(header.getFiscalYearName());
            row.add(header.getTotalBudget());
            row.add(header.getTotalAllocated());
            row.add(header.getTotalUtilized());
            row.add(header.getRemainingBudget());
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("Budget Headers Report")
                .headers(headers)
                .rows(rows)
                .build();
    }
}