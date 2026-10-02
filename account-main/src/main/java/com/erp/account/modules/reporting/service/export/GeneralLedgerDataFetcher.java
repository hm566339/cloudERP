package com.erp.account.modules.reporting.service.export;

import com.erp.account.modules.report.dto.response.GeneralLedgerResponse;
import com.erp.account.modules.report.dto.response.LedgerTransactionResponse;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.GeneralLedgerRequest;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.GeneralLedgerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class GeneralLedgerDataFetcher implements ReportDataFetcher {

    private final GeneralLedgerService generalLedgerService;

    @Override
    public boolean supports(String reportName) {
        return "general-ledger".equalsIgnoreCase(reportName) || "generalledger-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        GeneralLedgerRequest req = new GeneralLedgerRequest();
        req.setFromDate(request.getDateFrom());
        req.setToDate(request.getDateTo());
        
        if (request.getFilters() != null && request.getFilters().containsKey("accountId")) {
            Object accId = request.getFilters().get("accountId");
            if (accId != null && !accId.toString().isEmpty()) {
                req.setAccountId(java.util.UUID.fromString(accId.toString()));
            }
        }

        GeneralLedgerResponse response = generalLedgerService.generateGeneralLedger(req, request.getCompanyId());

        List<String> headers = List.of("Date", "Voucher Number", "Particulars", "Debit", "Credit", "Balance");
        List<List<Object>> rows = new ArrayList<>();

        if (response.getTransactions() != null) {
            for (LedgerTransactionResponse txn : response.getTransactions()) {
                List<Object> row = new ArrayList<>();
                row.add(txn.getVoucherDate() != null ? txn.getVoucherDate().toString() : "");
                row.add(txn.getVoucherNumber());
                row.add(txn.getDescription() != null ? txn.getDescription() : txn.getNarration());
                row.add(txn.getDebit());
                row.add(txn.getCredit());
                row.add(txn.getRunningBalance() != null ? txn.getRunningBalance().getAmount() : "");
                rows.add(row);
            }
        }

        String title = "General Ledger";
        if (response.getAccountName() != null) {
            title += " - " + response.getAccountName();
        }

        return ReportExportData.builder()
                .reportTitle(title)
                .headers(headers)
                .rows(rows)
                .build();
    }
}
