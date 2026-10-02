package com.erp.account.modules.gstslab.exporter;

import com.erp.account.modules.gstslab.dto.request.GstSlabFilterDto;
import com.erp.account.modules.gstslab.dto.response.GstSlabResponseList;
import com.erp.account.modules.gstslab.dto.response.GstSlabResponse;
import com.erp.account.modules.gstslab.service.GstSlabService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class GstSlabDataFetcher implements ReportDataFetcher {

    private final GstSlabService gstSlabService;

    @Override
    public boolean supports(String reportName) {
        return "gst-slabs".equalsIgnoreCase(reportName) || "gstslabdetails-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        GstSlabResponseList response = gstSlabService.getAllGstSlabs(new GstSlabFilterDto(), PageRequest.of(0, 10000));
        
        List<String> headers = Arrays.asList("Name", "CGST Rate", "SGST Rate", "IGST Rate", "Cess Rate");
        List<List<Object>> rows = new ArrayList<>();
        
        for (GstSlabResponse slab : response.getGstSlabs()) {
            List<Object> row = new ArrayList<>();
            row.add(slab.getSlabName());
            row.add(slab.getCgstRate());
            row.add(slab.getSgstRate());
            row.add(slab.getIgstRate());
            row.add(slab.getCessRate());
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("GST Slabs Report")
                .headers(headers)
                .rows(rows)
                .build();
    }
}