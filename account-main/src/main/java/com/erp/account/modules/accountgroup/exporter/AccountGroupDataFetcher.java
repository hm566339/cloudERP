package com.erp.account.modules.accountgroup.exporter;

import com.erp.account.modules.accountgroup.dto.request.AccountGroupFilterDto;
import com.erp.account.modules.accountgroup.dto.response.AccountGroupResponse;
import com.erp.account.modules.accountgroup.dto.response.AccountGroupResponseList;
import com.erp.account.modules.accountgroup.service.AccountGroupService;
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
public class AccountGroupDataFetcher implements ReportDataFetcher {

    private final AccountGroupService accountGroupService;

    @Override
    public boolean supports(String reportName) {
        return "account-groups".equalsIgnoreCase(reportName) || "accountgroups-export".equalsIgnoreCase(reportName) || "accountgroupmanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        AccountGroupFilterDto filter = new AccountGroupFilterDto();
        
        AccountGroupResponseList listResponse = accountGroupService.getAllAccountGroups(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.ASC, "code"))
        );

        List<List<Object>> rows = new ArrayList<>();
        if (listResponse.getData() != null) {
            for (AccountGroupResponse g : listResponse.getData()) {
                List<Object> row = new ArrayList<>();
                row.add(g.getCode() != null ? g.getCode() : "");
                row.add(g.getName() != null ? g.getName() : "");
                row.add(g.getCategoryName() != null ? g.getCategoryName() : "");
                row.add(g.getParentGroupName() != null ? g.getParentGroupName() : "");
                row.add(g.getDeleted() != null ? g.getDeleted() : false);
                rows.add(row);
            }
        }

        List<String> headers = List.of(
                "Group Code", "Group Name", "Category", "Parent Group", "Deleted"
        );

        return ReportExportData.builder()
                .reportTitle("Account Groups")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
