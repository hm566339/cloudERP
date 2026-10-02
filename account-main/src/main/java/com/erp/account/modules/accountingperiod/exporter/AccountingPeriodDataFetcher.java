package com.erp.account.modules.accountingperiod.exporter;

import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodFilterDto;
import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodResponse;
import com.erp.account.modules.accountingperiod.dto.response.AccountingPeriodResponseList;
import com.erp.account.modules.accountingperiod.service.AccountingPeriodService;
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
public class AccountingPeriodDataFetcher implements ReportDataFetcher {

    private final AccountingPeriodService accountingPeriodService;

    @Override
    public boolean supports(String reportName) {
        return "accounting-periods".equalsIgnoreCase(reportName) || "accountingperiods-export".equalsIgnoreCase(reportName) || "accountingperiodmanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        AccountingPeriodFilterDto filter = new AccountingPeriodFilterDto();
        
        AccountingPeriodResponseList listResponse = accountingPeriodService.getAllAccountingPeriods(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.ASC, "periodNumber"))
        );

        List<List<Object>> rows = new ArrayList<>();
        if (listResponse.getAccountingPeriods() != null) {
            for (AccountingPeriodResponse p : listResponse.getAccountingPeriods()) {
                List<Object> row = new ArrayList<>();
                row.add(p.getPeriodNumber() != null ? p.getPeriodNumber() : "");
                row.add(p.getPeriodName() != null ? p.getPeriodName() : "");
                row.add(p.getStartDate() != null ? p.getStartDate().toString() : "");
                row.add(p.getEndDate() != null ? p.getEndDate().toString() : "");
                row.add(p.getPeriodType() != null ? p.getPeriodType().name() : "");
                row.add(p.getStatus() != null ? p.getStatus().name() : "");
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Period Number", "Period Name", "Start Date", "End Date", "Period Type", "Status"
        );

        return ReportExportData.builder()
                .reportTitle("Accounting Periods")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
