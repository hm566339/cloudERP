package com.erp.account.modules.ledger.exporter;

import com.erp.account.modules.ledger.dto.request.ChartOfAccountFilterDto;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountResponse;
import com.erp.account.modules.ledger.dto.response.ChartOfAccountListResponse;
import com.erp.account.modules.ledger.service.ChartOfAccountService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ChartOfAccountDataFetcher implements ReportDataFetcher {

    private final ChartOfAccountService chartOfAccountService;

    @Override
    public boolean supports(String reportName) {
        return "chart-of-accounts".equalsIgnoreCase(reportName) || "chartofaccounts-export".equalsIgnoreCase(reportName) || "chartofaccountmanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        ChartOfAccountFilterDto filter = new ChartOfAccountFilterDto();
        
        ChartOfAccountListResponse listResponse = chartOfAccountService.getAllChartOfAccounts(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.ASC, "accountCode"))
        );

        List<List<Object>> rows = new ArrayList<>();
        if (listResponse.getData() != null) {
            for (ChartOfAccountResponse a : listResponse.getData()) {
                List<Object> row = new ArrayList<>();
                row.add(a.getAccountCode() != null ? a.getAccountCode() : "");
                row.add(a.getAccountName() != null ? a.getAccountName() : "");
                row.add(a.getGroupName() != null ? a.getGroupName() : "");
                row.add(a.getAccountType() != null ? a.getAccountType().name() : "");
                row.add(a.getParentAccountCode() != null ? a.getParentAccountCode() : "");
                row.add(a.getPostingAllowed() != null ? a.getPostingAllowed() : false);
                row.add(a.getIsActive() != null ? a.getIsActive() : false);
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Account Code", "Account Name", "Group", "Type", "Parent Code", "Posting Allowed", "Active"
        );

        return ReportExportData.builder()
                .reportTitle("Chart of Accounts")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
