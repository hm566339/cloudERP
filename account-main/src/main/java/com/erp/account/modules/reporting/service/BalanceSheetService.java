package com.erp.account.modules.reporting.service;

import com.erp.account.modules.report.dto.response.BalanceSheetResponse;
import com.erp.account.modules.reporting.dto.request.BalanceSheetRequest;

public interface BalanceSheetService {
    BalanceSheetResponse generateBalanceSheet(BalanceSheetRequest request);
}
