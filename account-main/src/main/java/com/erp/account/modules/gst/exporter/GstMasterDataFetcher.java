package com.erp.account.modules.gst.exporter;

import com.erp.account.modules.gst.dto.response.GstStateCodeResponse;
import com.erp.account.modules.gst.service.GstMasterService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class GstMasterDataFetcher implements ReportDataFetcher {

    private final GstMasterService gstMasterService;

    @Override
    public boolean supports(String reportName) {
        return "gst-states".equalsIgnoreCase(reportName) || "gststatemaster-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        List<GstStateCodeResponse> response = gstMasterService.getAllStateCodes();
        
        List<String> headers = Arrays.asList("State Code", "State Name", "Is Union Territory", "Status");
        List<List<Object>> rows = new ArrayList<>();
        
        for (GstStateCodeResponse state : response) {
            List<Object> row = new ArrayList<>();
            row.add(state.getStateCode());
            row.add(state.getStateName());
            row.add(state.isUnionTerritory() ? "Yes" : "No");
            row.add(state.isActive() ? "Active" : "Inactive");
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("GST State Master Report")
                .headers(headers)
                .rows(rows)
                .build();
    }
}