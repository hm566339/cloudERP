package com.erp.account.modules.auditlog.exporter;

import com.erp.account.modules.auditlog.dto.request.AuditLogFilterDto;
import com.erp.account.modules.auditlog.dto.response.AuditLogResponse;
import com.erp.account.modules.auditlog.service.AuditLogService;
import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;
import com.erp.account.modules.reporting.service.export.ReportDataFetcher;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
public class AuditLogDataFetcher implements ReportDataFetcher {

    private final AuditLogService auditLogService;

    @Override
    public boolean supports(String reportName) {
        return "audit-logs".equalsIgnoreCase(reportName) || "auditlogspage-export".equalsIgnoreCase(reportName);
    }

    @Override
    public ReportExportData fetch(ReportExportRequest request) {
        AuditLogFilterDto filter = new AuditLogFilterDto();
        
        if (request.getDateFrom() != null) {
            filter.setFromDate(request.getDateFrom().atStartOfDay());
        }
        if (request.getDateTo() != null) {
            filter.setToDate(request.getDateTo().atTime(23, 59, 59));
        }

        Page<AuditLogResponse> response = auditLogService.searchAuditLogs(filter, PageRequest.of(0, 10000), request.getCompanyId());
        
        List<String> headers = Arrays.asList("Timestamp", "Module", "Entity", "Action", "Performed By", "IP Address");
        List<List<Object>> rows = new ArrayList<>();
        
        for (AuditLogResponse log : response.getContent()) {
            List<Object> row = new ArrayList<>();
            row.add(log.getPerformedAt());
            row.add(log.getModuleName());
            row.add(log.getEntityName());
            row.add(log.getActionType());
            row.add(log.getPerformedByUsername());
            row.add(log.getIpAddress());
            rows.add(row);
        }

        return ReportExportData.builder()
                .reportTitle("Audit Logs Report")
                .headers(headers)
                .rows(rows)
                .build();
    }
}