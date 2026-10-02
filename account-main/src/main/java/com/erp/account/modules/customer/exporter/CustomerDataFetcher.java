package com.erp.account.modules.customer.exporter;

import com.erp.account.modules.customer.dto.request.CustomerFilterDto;
import com.erp.account.modules.customer.dto.response.CustomerResponse;
import com.erp.account.modules.customer.service.CustomerService;
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
public class CustomerDataFetcher implements ReportDataFetcher {

    private final CustomerService customerService;

    @Override
    public boolean supports(String reportName) {
        return "customers".equalsIgnoreCase(reportName) || "customermanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        CustomerFilterDto filter = new CustomerFilterDto();
        
        Page<CustomerResponse> page = customerService.getAllCustomers(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.ASC, "customerCode"))
        );

        List<List<Object>> rows = new ArrayList<>();
        for (CustomerResponse c : page.getContent()) {
            List<Object> row = new ArrayList<>();
            row.add(c.getCustomerCode() != null ? c.getCustomerCode() : "");
            row.add(c.getCustomerName() != null ? c.getCustomerName() : "");
            row.add(c.getGstin() != null ? c.getGstin() : "");
            row.add(c.getEmail() != null ? c.getEmail() : "");
            row.add(c.getPhone() != null ? c.getPhone() : "");
                row.add(c.getAddresses() != null && !c.getAddresses().isEmpty()
                    && c.getAddresses().stream().anyMatch(address -> Boolean.TRUE.equals(address.getIsDefault()))
                    ? c.getAddresses().stream().filter(address -> Boolean.TRUE.equals(address.getIsDefault()))
                    .findFirst().map(address -> address.getCity()).orElse("") : "");
            row.add(c.getOutstandingBalance() != null ? c.getOutstandingBalance() : 0);
            row.add(c.getIsActive() != null ? c.getIsActive() : false);
            rows.add(row);
        }

        List<String> headers = List.of(
                "Customer Code", "Name", "GSTIN", "Email", "Phone", "City", "Outstanding Balance", "Active"
        );

        return ReportExportData.builder()
                .reportTitle("Customer Master List")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
