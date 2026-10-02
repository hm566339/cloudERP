package com.erp.account.modules.accountcategory.exporter;

import com.erp.account.modules.accountcategory.dto.request.AccountCategoryFilterDto;
import com.erp.account.modules.accountcategory.dto.response.AccountCategoryResponse;
import com.erp.account.modules.accountcategory.dto.response.AccountCategoryResponseList;
import com.erp.account.modules.accountcategory.service.AccountCategoryService;
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
public class AccountCategoryDataFetcher implements ReportDataFetcher {

    private final AccountCategoryService accountCategoryService;

    @Override
    public boolean supports(String reportName) {
        return "account-categories".equalsIgnoreCase(reportName) || "accountcategories-export".equalsIgnoreCase(reportName) || "accountcategorymanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        AccountCategoryFilterDto filter = new AccountCategoryFilterDto();
        
        AccountCategoryResponseList listResponse = accountCategoryService.getAllAccountCategories(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.ASC, "code"))
        );

        List<List<Object>> rows = new ArrayList<>();
        if (listResponse.getAccountCategories() != null) {
            for (AccountCategoryResponse c : listResponse.getAccountCategories()) {
                List<Object> row = new ArrayList<>();
                row.add(c.getCode() != null ? c.getCode() : "");
                row.add(c.getName() != null ? c.getName() : "");
                row.add(c.getNature() != null ? c.getNature().name() : "");
                row.add(c.getIsDeleted() != null ? c.getIsDeleted() : false);
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Code", "Name", "Nature", "Deleted"
        );

        return ReportExportData.builder()
                .reportTitle("Account Categories")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
