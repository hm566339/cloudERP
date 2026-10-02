package com.erp.account.modules.reporting.service.export;

import com.erp.account.modules.report.dto.response.TrialBalanceResponse;
import com.erp.account.modules.report.dto.response.TrialBalanceRow;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.dto.request.ReportFilter;
import com.erp.account.modules.reporting.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class TrialBalanceDataFetcher implements ReportDataFetcher {

    private final ReportService reportService;

    @Override
    public boolean supports(String reportName) {
        return "trial-balance".equalsIgnoreCase(reportName) || "trialbalance-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        ReportFilter filter = new ReportFilter();
        filter.setCompanyId(request.getCompanyId());
        filter.setFromDate(request.getDateFrom());
        filter.setToDate(request.getDateTo());

        TrialBalanceResponse response = reportService.getTrialBalance(filter);

        List<String> headers = List.of("Account Code", "Account Name", "Opening Debit", "Opening Credit", "Period Debit", "Period Credit", "Closing Balance");
        List<List<Object>> rows = new ArrayList<>();

        if (response.getRows() != null) {
            for (TrialBalanceRow tbRow : response.getRows()) {
                List<Object> row = new ArrayList<>();
                row.add(tbRow.getAccountCode());
                row.add(tbRow.getAccountName());
                row.add(tbRow.getOpeningDebit());
                row.add(tbRow.getOpeningCredit());
                row.add(tbRow.getDebitTotal());
                row.add(tbRow.getCreditTotal());
                row.add(tbRow.getClosingBalance());
                rows.add(row);
            }
        }

        return ReportExportData.builder()
                .reportTitle("Trial Balance")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
