package com.erp.account.modules.vendor.exporter;

import com.erp.account.modules.vendor.dto.request.VendorFilterDto;
import com.erp.account.modules.vendor.dto.response.VendorResponse;
import com.erp.account.modules.vendor.service.VendorService;
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
public class VendorDataFetcher implements ReportDataFetcher {

    private final VendorService vendorService;

    @Override
    public boolean supports(String reportName) {
        return "vendors".equalsIgnoreCase(reportName) || "vendormanagement-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        VendorFilterDto filter = new VendorFilterDto();
        
        Page<VendorResponse> page = vendorService.getAllVendors(
                filter, PageRequest.of(0, 10000, Sort.by(Sort.Direction.ASC, "vendorCode"))
        );

        List<List<Object>> rows = new ArrayList<>();
        for (VendorResponse v : page.getContent()) {
            List<Object> row = new ArrayList<>();
            row.add(v.getVendorCode() != null ? v.getVendorCode() : "");
            row.add(v.getVendorName() != null ? v.getVendorName() : "");
            row.add(v.getGstin() != null ? v.getGstin() : "");
            row.add(v.getEmail() != null ? v.getEmail() : "");
            row.add(v.getPhone() != null ? v.getPhone() : "");
            row.add(v.getCity() != null ? v.getCity() : "");
            row.add(v.getOutstandingBalance() != null ? v.getOutstandingBalance() : 0);
            row.add(v.getIsActive() != null ? v.getIsActive() : false);
            rows.add(row);
        }

        List<String> headers = List.of(
                "Vendor Code", "Name", "GSTIN", "Email", "Phone", "City", "Outstanding Balance", "Active"
        );

        return ReportExportData.builder()
                .reportTitle("Vendor Master List")
                .headers(headers)
                .rows(rows)
                .build();
    }
}
