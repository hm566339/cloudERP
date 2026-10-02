package com.erp.account.modules.reporting.dto.request;

import com.erp.account.enums.ExportFormat;
import lombok.Data;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@Data
public class ReportExportRequest {
    private LocalDate dateFrom;
    private LocalDate dateTo;
    private ExportFormat format;
    private UUID companyId;
    private Map<String, Object> filters;
}
