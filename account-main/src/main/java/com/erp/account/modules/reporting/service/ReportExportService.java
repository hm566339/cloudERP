package com.erp.account.modules.reporting.service;

import com.erp.account.modules.reporting.dto.request.ReportFilter;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

public interface ReportExportService {
    void exportTrialBalancePdf(ReportFilter filter, HttpServletResponse response) throws IOException;
    void exportTrialBalanceExcel(ReportFilter filter, HttpServletResponse response) throws IOException;
}
