package com.erp.account.modules.creditnote.exporter;

import com.erp.account.modules.creditnote.dto.request.CreditNoteFilterDto;
import com.erp.account.modules.creditnote.dto.response.CreditNoteResponse;
import com.erp.account.modules.creditnote.service.CreditNoteService;
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
public class CreditNoteDataFetcher implements ReportDataFetcher {

    private final CreditNoteService creditNoteService;

    @Override
    public boolean supports(String reportName) {
        return "credit-notes".equalsIgnoreCase(reportName) || "creditnote-export".equalsIgnoreCase(reportName) || "creditnotes-export".equalsIgnoreCase(reportName) || "creditnotemanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        CreditNoteFilterDto filter = new CreditNoteFilterDto();
        
        Page<CreditNoteResponse> page = creditNoteService.getAllCreditNotes(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.DESC, "noteDate"))
        );

        List<List<Object>> rows = new ArrayList<>();
        if (page.getContent() != null) {
            for (CreditNoteResponse c : page.getContent()) {
                List<Object> row = new ArrayList<>();
                row.add(c.getCreditNoteNo() != null ? c.getCreditNoteNo() : "");
                row.add(c.getNoteDate() != null ? c.getNoteDate().toString() : "");
                row.add(c.getCustomerName() != null ? c.getCustomerName() : "");
                row.add(c.getAmount() != null ? c.getAmount() : 0);
                row.add(c.getReason() != null ? c.getReason() : "");
                row.add(c.getStatus() != null ? c.getStatus().name() : "");
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Credit Note No", "Date", "Customer Name", "Amount", "Reason", "Status"
        );

        return ReportExportData.builder()
                .reportTitle("Credit Notes")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
