package com.erp.account.modules.banktransaction.exporter;

import com.erp.account.modules.banktransaction.dto.request.BankTransactionFilterDto;
import com.erp.account.modules.banktransaction.dto.response.BankTransactionListResponse;
import com.erp.account.modules.banktransaction.dto.response.BankTransactionResponse;
import com.erp.account.modules.banktransaction.service.BankTransactionService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class BankTransactionDataFetcher implements ReportDataFetcher {

    private final BankTransactionService bankTransactionService;

    @Override
    public boolean supports(String reportName) {
        return "bank-transactions".equalsIgnoreCase(reportName) || "banktransactions-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        BankTransactionFilterDto filter = new BankTransactionFilterDto();
        
        if (request.getDateFrom() != null) {
            filter.setFromDate(request.getDateFrom());
        }
        if (request.getDateTo() != null) {
            filter.setToDate(request.getDateTo());
        }

        BankTransactionListResponse response = bankTransactionService.getAllTransactions(filter, PageRequest.of(0, 10000));
        
        List<String> headers = Arrays.asList("Date", "Reference", "UTR No", "Type", "Debit", "Credit");
        List<List<Object>> rows = new ArrayList<>();
        
        for (BankTransactionResponse tx : response.getTransactions()) {
            List<Object> row = new ArrayList<>();
            row.add(tx.getTransactionDate());
            row.add(tx.getReferenceNo());
            row.add(tx.getUtrNo());
            row.add(tx.getTransactionType() != null ? tx.getTransactionType().name() : "");
            row.add(tx.getDebitAmount() != null ? tx.getDebitAmount() : 0.0);
            row.add(""); 
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("Bank Transactions Report")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
