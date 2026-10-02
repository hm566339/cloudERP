package com.erp.account.modules.reporting.service.export;

import com.erp.account.modules.report.dto.response.ProfitLossResponse;
import com.erp.account.modules.report.dto.response.ProfitLossRow;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ProfitLossRequest;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.ProfitLossService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ProfitLossDataFetcher implements ReportDataFetcher {

    private final ProfitLossService profitLossService;

    @Override
    public boolean supports(String reportName) {
        return "profit-loss".equalsIgnoreCase(reportName) || "profitloss".equalsIgnoreCase(reportName) || "profitloss-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        ProfitLossRequest filter = new ProfitLossRequest();
        filter.setCompanyId(request.getCompanyId());
        filter.setFromDate(request.getDateFrom());
        filter.setToDate(request.getDateTo());
        
        filter.setExport(true);
        filter.setPage(0);
        filter.setPageSize(100000);

        ProfitLossResponse response = profitLossService.generateProfitLoss(filter);

        List<String> headers = List.of(
            "Account Code", "Account Name", "Account Group", "Account Type", 
            "Opening Balance", "Debit", "Credit", "Closing Balance"
        );

        List<List<Object>> rows = new ArrayList<>();
        if (response.getRows() != null) {
            for (ProfitLossRow r : response.getRows()) {
                List<Object> row = new ArrayList<>();
                row.add(r.getAccountCode() != null ? r.getAccountCode() : "");
                row.add(r.getAccountName() != null ? r.getAccountName() : "");
                row.add(r.getAccountGroup() != null ? r.getAccountGroup() : "");
                row.add(r.getAccountType() != null ? r.getAccountType() : "");
                row.add(r.getOpeningBalance());
                row.add(r.getPeriodDebit());
                row.add(r.getPeriodCredit());
                row.add(r.getClosingBalance());
                
                rows.add(row);
            }
        }

        return ReportExportData.builder()
                .reportTitle("Profit & Loss Statement")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
