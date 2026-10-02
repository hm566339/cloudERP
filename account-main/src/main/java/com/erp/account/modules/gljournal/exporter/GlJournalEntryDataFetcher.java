package com.erp.account.modules.gljournal.exporter;

import com.erp.account.modules.gljournal.dto.request.GlJournalEntryFilterDto;
import com.erp.account.modules.gljournal.dto.response.GlJournalEntryListResponse;
import com.erp.account.modules.gljournal.service.GlJournalEntryService;
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
public class GlJournalEntryDataFetcher implements ReportDataFetcher {

    private final GlJournalEntryService glJournalEntryService;

    @Override
    public boolean supports(String reportName) {
        return "gl-journals".equalsIgnoreCase(reportName) || "gljournal-export".equalsIgnoreCase(reportName) || "gljournals-export".equalsIgnoreCase(reportName) || "gljournalmanagement-export".equalsIgnoreCase(reportName) || "journalentries-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        GlJournalEntryFilterDto filter = new GlJournalEntryFilterDto();
        
        Page<GlJournalEntryListResponse> page = glJournalEntryService.getAllJournals(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "voucherDate"))
        );

        List<List<Object>> rows = new ArrayList<>();
        if (page.getContent() != null) {
            for (GlJournalEntryListResponse j : page.getContent()) {
                List<Object> row = new ArrayList<>();
                row.add(j.getVoucherNo() != null ? j.getVoucherNo() : "");
                row.add(j.getVoucherDate() != null ? j.getVoucherDate().toString() : "");
                row.add(j.getSourceModule() != null ? j.getSourceModule() : "");
                row.add(j.getReferenceNo() != null ? j.getReferenceNo() : "");
                row.add(j.getTotalDebit() != null ? j.getTotalDebit() : 0);
                row.add(j.getTotalCredit() != null ? j.getTotalCredit() : 0);
                row.add(j.getStatus() != null ? j.getStatus().name() : "");
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Journal No", "Date", "Source", "Reference", "Total Debit", "Total Credit", "Status"
        );

        return ReportExportData.builder()
                .reportTitle("GL Journals")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
