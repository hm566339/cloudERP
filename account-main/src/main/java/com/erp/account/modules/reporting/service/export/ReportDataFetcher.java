package com.erp.account.modules.reporting.service.export;

import com.erp.account.modules.reporting.dto.ReportExportData;
import com.erp.account.modules.reporting.dto.request.ReportExportRequest;

public interface ReportDataFetcher {
    ReportExportData fetch(ReportExportRequest request);
    boolean supports(String reportName);
}
