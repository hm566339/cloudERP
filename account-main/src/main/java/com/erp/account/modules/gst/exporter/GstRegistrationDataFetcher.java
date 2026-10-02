package com.erp.account.modules.gst.exporter;

import com.erp.account.modules.gst.dto.response.GstRegistrationResponse;
import com.erp.account.modules.gst.service.GstMasterService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class GstRegistrationDataFetcher implements ReportDataFetcher {

    private final GstMasterService gstMasterService;

    @Override
    public boolean supports(String reportName) {
        return "gst-registrations".equalsIgnoreCase(reportName) || "gstregistrations-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        if (request.getCompanyId() == null) {
            throw new IllegalArgumentException("Company ID is required for GST Registrations export");
        }
        
        List<GstRegistrationResponse> response = gstMasterService.getRegistrationsByCompanyId(request.getCompanyId());
        
        List<String> headers = Arrays.asList("GSTIN", "Legal Name", "Trade Name", "Registration Type", "State", "Is Default");
        List<List<Object>> rows = new ArrayList<>();
        
        for (GstRegistrationResponse reg : response) {
            List<Object> row = new ArrayList<>();
            row.add(reg.getGstin());
            row.add(reg.getLegalName());
            row.add(reg.getTradeName());
            row.add(reg.getRegistrationType());
            row.add(reg.getStateCode() != null ? reg.getStateCode().getStateName() : "");
            row.add(reg.isDefault() ? "Yes" : "No");
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("GST Registrations Report")
                .headers(headers)
                .rows(rows)
                .build();
    }
}