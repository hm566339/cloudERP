package com.erp.account.modules.debitnote.exporter;

import com.erp.account.modules.debitnote.dto.request.DebitNoteFilterDto;
import com.erp.account.modules.debitnote.dto.response.DebitNoteResponse;
import com.erp.account.modules.debitnote.service.DebitNoteService;
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
public class DebitNoteDataFetcher implements ReportDataFetcher {

    private final DebitNoteService debitNoteService;

    @Override
    public boolean supports(String reportName) {
        return "debit-notes".equalsIgnoreCase(reportName) || "debitnote-export".equalsIgnoreCase(reportName) || "debitnotes-export".equalsIgnoreCase(reportName) || "debitnotemanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        DebitNoteFilterDto filter = new DebitNoteFilterDto();
        
        Page<DebitNoteResponse> page = debitNoteService.getAllDebitNotes(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "noteDate"))
        );

        List<List<Object>> rows = new ArrayList<>();
        if (page.getContent() != null) {
            for (DebitNoteResponse d : page.getContent()) {
                List<Object> row = new ArrayList<>();
                row.add(d.getDebitNoteNo() != null ? d.getDebitNoteNo() : "");
                row.add(d.getNoteDate() != null ? d.getNoteDate().toString() : "");
                row.add(d.getVendorName() != null ? d.getVendorName() : "");
                row.add(d.getAmount() != null ? d.getAmount() : 0);
                row.add(d.getReason() != null ? d.getReason() : "");
                row.add(d.getStatus() != null ? d.getStatus().name() : "");
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Debit Note No", "Date", "Vendor Name", "Amount", "Reason", "Status"
        );

        return ReportExportData.builder()
                .reportTitle("Debit Notes")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
