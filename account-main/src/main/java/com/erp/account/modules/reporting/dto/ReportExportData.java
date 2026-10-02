package com.erp.account.modules.reporting.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class ReportExportData {
    private String reportTitle;
    private List<String> headers;
    private List<List<Object>> rows;
    private Map<String, Object> summaryTotals;
}
