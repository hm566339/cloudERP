package com.erp.account.modules.bankaccount.exporter;

import com.erp.account.modules.bankaccount.dto.request.BankAccountFilterDto;
import com.erp.account.modules.bankaccount.dto.response.BankAccountListResponse;
import com.erp.account.modules.bankaccount.dto.response.BankAccountResponse;
import com.erp.account.modules.bankaccount.service.BankAccountService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class BankAccountDataFetcher implements ReportDataFetcher {

    private final BankAccountService bankAccountService;

    @Override
    public boolean supports(String reportName) {
        return "bank-accounts".equalsIgnoreCase(reportName) || "bankaccounts-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        BankAccountFilterDto filter = new BankAccountFilterDto();
        
        if (request.getCompanyId() != null) {
            filter.setCompanyId(request.getCompanyId());
        }

        BankAccountListResponse response = bankAccountService.getAllBankAccounts(filter, PageRequest.of(0, 10000));
        
        List<String> headers = Arrays.asList("Bank Name", "Branch", "Account Number", "IFSC", "Account Type", "GL Account", "Current Balance", "Status");
        List<List<Object>> rows = new ArrayList<>();
        
        for (BankAccountResponse account : response.getBankAccounts()) {
            List<Object> row = new ArrayList<>();
            row.add(account.getBankName());
            row.add(account.getBranchName());
            row.add(account.getAccountNumber());
            row.add(account.getIfscCode());
            row.add(account.getAccountType() != null ? account.getAccountType().name() : "");
            row.add(account.getGlAccountName());
            row.add(account.getCurrentBalance());
            row.add(account.getIsActive() != null && account.getIsActive() ? "Active" : "Inactive");
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("Bank Accounts Report")
                .headers(headers)
                .rows(rows)
                .build();
    }
}