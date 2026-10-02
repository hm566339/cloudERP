package com.erp.account.modules.fiscalyear.exporter;

import com.erp.account.modules.fiscalyear.dto.request.FiscalYearFilterDto;
import com.erp.account.modules.fiscalyear.dto.response.FiscalYearResponse;
import com.erp.account.modules.fiscalyear.dto.response.FiscalYearResponseList;
import com.erp.account.modules.fiscalyear.service.FiscalYearService;
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
public class FiscalYearDataFetcher implements ReportDataFetcher {

    private final FiscalYearService fiscalYearService;

    @Override
    public boolean supports(String reportName) {
        return "fiscal-years".equalsIgnoreCase(reportName) || "fiscalyears-export".equalsIgnoreCase(reportName) || "fiscalyearmanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        FiscalYearFilterDto filter = new FiscalYearFilterDto();
        
        FiscalYearResponseList listResponse = fiscalYearService.getAllFiscalYears(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.ASC, "fiscalYear")), null
        );

        List<List<Object>> rows = new ArrayList<>();
        if (listResponse.getFiscalYears() != null) {
            for (FiscalYearResponse f : listResponse.getFiscalYears()) {
                List<Object> row = new ArrayList<>();
                row.add(f.getFiscalYear() != null ? f.getFiscalYear() : "");
                row.add(f.getStartDate() != null ? f.getStartDate().toString() : "");
                row.add(f.getEndDate() != null ? f.getEndDate().toString() : "");
                row.add(f.getIsClosed() != null ? f.getIsClosed() : false);
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Fiscal Year", "Start Date", "End Date", "Closed"
        );

        return ReportExportData.builder()
                .reportTitle("Fiscal Years")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
