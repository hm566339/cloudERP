package com.erp.account.modules.hsnsacmaster.exporter;

import com.erp.account.enums.HsnSacType;
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

import java.math.BigDecimal;
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
        if (request != null && request.getFilters() != null) {
            Map<String, Object> f = request.getFilters();
            if (f.get("searchKey") != null) filter.setSearchKey(f.get("searchKey").toString());
            if (f.get("code") != null) filter.setCode(f.get("code").toString());
            if (f.get("type") != null) {
                filter.setType(f.get("type").toString().toUpperCase());
            }
        }
        
        HsnSacMasterResponseList responseList = hsnSacMasterService.getAllHsnSacMasters(filter, PageRequest.of(0, 10000));
        List<HsnSacMasterResponse> items = responseList.getHsnSacMasters() != null ? responseList.getHsnSacMasters() : Collections.emptyList();

        if (request != null && request.getFilters() != null && request.getFilters().get("selectedIds") instanceof Collection<?> selectedIds && !selectedIds.isEmpty()) {
            Set<String> idStrings = ((Collection<?>) selectedIds).stream().map(String::valueOf).collect(java.util.stream.Collectors.toSet());
            items = items.stream().filter(item -> item.getId() != null && idStrings.contains(item.getId().toString())).toList();
        }
        
        List<String> headers = Arrays.asList("Code", "Description", "Type", "CGST Rate (%)", "SGST Rate (%)", "IGST Rate (%)", "CESS Rate (%)", "Status");
        List<List<Object>> rows = new ArrayList<>();
        
        for (HsnSacMasterResponse item : items) {
            List<Object> row = new ArrayList<>();
            row.add(item.getCode() != null ? item.getCode() : "");
            row.add(item.getDescription() != null ? item.getDescription() : "");
            row.add(item.getType() != null ? item.getType().name() : "");
            row.add(item.getCgstRate() != null ? item.getCgstRate() : BigDecimal.ZERO);
            row.add(item.getSgstRate() != null ? item.getSgstRate() : BigDecimal.ZERO);
            row.add(item.getIgstRate() != null ? item.getIgstRate() : BigDecimal.ZERO);
            row.add(item.getCessRate() != null ? item.getCessRate() : BigDecimal.ZERO);
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