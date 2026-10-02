package com.erp.account.modules.gljournal.exporter;

import com.erp.account.modules.gljournal.dto.request.GlJournalLineFilterDto;
import com.erp.account.modules.gljournal.dto.response.GlJournalLineResponse;
import com.erp.account.modules.gljournal.service.GlJournalLineService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class GlJournalLineDataFetcher implements ReportDataFetcher {

    private final GlJournalLineService glJournalLineService;

    @Override
    public boolean supports(String reportName) {
        return "gl-journal-lines".equalsIgnoreCase(reportName) || "gljournalline-export".equalsIgnoreCase(reportName) || "gljournallines-export".equalsIgnoreCase(reportName) || "gljournallinemanagement-export".equalsIgnoreCase(reportName) || "journallines-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        GlJournalLineFilterDto filter = new GlJournalLineFilterDto();
        
        Page<GlJournalLineResponse> page = glJournalLineService.getAllLines(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "journalEntry.voucherDate"))
        );

        List<List<Object>> rows = new ArrayList<>();
        if (page.getContent() != null) {
            for (GlJournalLineResponse l : page.getContent()) {
                List<Object> row = new ArrayList<>();
                row.add(l.getVoucherNo() != null ? l.getVoucherNo() : "");
                row.add(l.getVoucherDate() != null ? l.getVoucherDate().toString() : "");
                row.add(l.getAccountCode() != null ? l.getAccountCode() : "");
                row.add(l.getAccountName() != null ? l.getAccountName() : "");
                row.add(l.getDebitAmount() != null ? l.getDebitAmount() : 0);
                row.add(l.getCreditAmount() != null ? l.getCreditAmount() : 0);
                row.add(l.getLineDescription() != null ? l.getLineDescription() : "");
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Journal No", "Date", "Account Code", "Account Name", "Debit", "Credit", "Description"
        );

        return ReportExportData.builder()
                .reportTitle("GL Journal Lines")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
