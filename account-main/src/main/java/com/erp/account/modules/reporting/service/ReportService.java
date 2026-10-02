package com.erp.account.modules.reporting.service;

import com.erp.account.modules.report.dto.response.TrialBalanceResponse;
import com.erp.account.modules.reporting.dto.request.ReportFilter;

public interface ReportService {
    TrialBalanceResponse getTrialBalance(ReportFilter filter);
}
