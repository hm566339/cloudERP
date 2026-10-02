package com.erp.account.modules.hsnsacmaster.exporter;

import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterFilterDto;
import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponse;
import com.erp.account.modules.hsnsacmaster.dto.response.HsnSacMasterResponseList;
import com.erp.account.modules.hsnsacmaster.service.HsnSacMasterService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class HsnSacDataFetcher implements ReportDataFetcher {

    private final HsnSacMasterService hsnSacMasterService;

    @Override
    public boolean supports(String reportName) {
        return "hsn-sac".equalsIgnoreCase(reportName) || "hsnpage-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        HsnSacMasterFilterDto filter = new HsnSacMasterFilterDto();
        
        HsnSacMasterResponseList responseList = hsnSacMasterService.getAllHsnSacMasters(filter, PageRequest.of(0, 10000));
        
        List<String> headers = Arrays.asList("Code", "Description", "Type", "CGST Rate", "SGST Rate", "Status");
        List<List<Object>> rows = new ArrayList<>();
        
        for (HsnSacMasterResponse item : responseList.getHsnSacMasters()) {
            List<Object> row = new ArrayList<>();
            row.add(item.getCode());
            row.add(item.getDescription());
            row.add(item.getType() != null ? item.getType().name() : "");
            row.add(item.getCgstRate());
            row.add(item.getSgstRate());
            row.add(!item.isDeleted() ? "Active" : "Inactive");
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("HSN/SAC Master Report")
                .headers(headers)
                .rows(rows)
                .build();
    }
}