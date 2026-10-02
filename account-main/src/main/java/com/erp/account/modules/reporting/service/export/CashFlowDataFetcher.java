package com.erp.account.modules.reporting.service.export;

import com.erp.account.modules.reporting.dto.response.CashFlowReportResponse;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.CashFlowRequest;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.CashFlowReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class CashFlowDataFetcher implements ReportDataFetcher {

    private final CashFlowReportService cashFlowReportService;

    @Override
    public boolean supports(String reportName) {
        return "cash-flow".equalsIgnoreCase(reportName) || "cashflow".equalsIgnoreCase(reportName) || "cashflow-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        CashFlowRequest filter = new CashFlowRequest();
        filter.setCompanyId(request.getCompanyId());
        filter.setStartDate(request.getDateFrom());
        filter.setEndDate(request.getDateTo());
        
        filter.setExport(true);
        filter.setPage(0);
        filter.setPageSize(100000);

        CashFlowReportResponse response = cashFlowReportService.getCashFlowReport(filter);

        List<String> headers = List.of(
            "Activity Type", "Category", "Amount"
        );

        List<List<Object>> rows = new ArrayList<>();
        
        // Operating Activities
        if (response.getOperatingActivities() != null) {
            if (response.getOperatingActivities().getCashIn() != null) {
                for (CashFlowReportResponse.CashFlowLine line : response.getOperatingActivities().getCashIn()) {
                    rows.add(List.of("Operating - Cash In", line.getCategory() != null ? line.getCategory() : "", line.getAmount()));
                }
            }
            if (response.getOperatingActivities().getCashOut() != null) {
                for (CashFlowReportResponse.CashFlowLine line : response.getOperatingActivities().getCashOut()) {
                    rows.add(List.of("Operating - Cash Out", line.getCategory() != null ? line.getCategory() : "", line.getAmount()));
                }
            }
            rows.add(List.of("Operating - Net Cash Flow", "", response.getOperatingActivities().getNetCashFlow() != null ? response.getOperatingActivities().getNetCashFlow() : 0));
        }
        
        // Investing Activities
        if (response.getInvestingActivities() != null) {
            if (response.getInvestingActivities().getCashIn() != null) {
                for (CashFlowReportResponse.CashFlowLine line : response.getInvestingActivities().getCashIn()) {
                    rows.add(List.of("Investing - Cash In", line.getCategory() != null ? line.getCategory() : "", line.getAmount()));
                }
            }
            if (response.getInvestingActivities().getCashOut() != null) {
                for (CashFlowReportResponse.CashFlowLine line : response.getInvestingActivities().getCashOut()) {
                    rows.add(List.of("Investing - Cash Out", line.getCategory() != null ? line.getCategory() : "", line.getAmount()));
                }
            }
            rows.add(List.of("Investing - Net Cash Flow", "", response.getInvestingActivities().getNetCashFlow() != null ? response.getInvestingActivities().getNetCashFlow() : 0));
        }

        // Financing Activities
        if (response.getFinancingActivities() != null) {
            if (response.getFinancingActivities().getCashIn() != null) {
                for (CashFlowReportResponse.CashFlowLine line : response.getFinancingActivities().getCashIn()) {
                    rows.add(List.of("Financing - Cash In", line.getCategory() != null ? line.getCategory() : "", line.getAmount()));
                }
            }
            if (response.getFinancingActivities().getCashOut() != null) {
                for (CashFlowReportResponse.CashFlowLine line : response.getFinancingActivities().getCashOut()) {
                    rows.add(List.of("Financing - Cash Out", line.getCategory() != null ? line.getCategory() : "", line.getAmount()));
                }
            }
            rows.add(List.of("Financing - Net Cash Flow", "", response.getFinancingActivities().getNetCashFlow() != null ? response.getFinancingActivities().getNetCashFlow() : 0));
        }

        return ReportExportData.builder()
                .reportTitle("Cash Flow Statement")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
