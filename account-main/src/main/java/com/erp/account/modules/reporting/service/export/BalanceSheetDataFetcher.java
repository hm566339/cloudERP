package com.erp.account.modules.reporting.service.export;

import com.erp.account.modules.report.dto.response.BalanceSheetResponse;
import com.erp.account.modules.report.dto.response.BalanceSheetRow;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.BalanceSheetRequest;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.BalanceSheetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BalanceSheetDataFetcher implements ReportDataFetcher {

    private final BalanceSheetService balanceSheetService;

    @Override
    public boolean supports(String reportName) {
        return "balance-sheet".equalsIgnoreCase(reportName) || "balancesheet".equalsIgnoreCase(reportName) || "balancesheet-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        BalanceSheetRequest filter = new BalanceSheetRequest();
        filter.setCompanyId(request.getCompanyId());
        filter.setFromDate(request.getDateFrom());
        filter.setToDate(request.getDateTo());
        
        filter.setExport(true);
        filter.setPage(0);
        filter.setPageSize(100000);

        BalanceSheetResponse response = balanceSheetService.generateBalanceSheet(filter);

        List<String> headers = List.of(
            "Account Code", "Account Name", "Account Group", "Account Type", 
            "Opening Balance", "Debit", "Credit", "Closing Balance"
        );

        List<List<Object>> rows = new ArrayList<>();
        if (response.getRows() != null) {
            for (BalanceSheetRow r : response.getRows()) {
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
                .reportTitle("Balance Sheet")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
