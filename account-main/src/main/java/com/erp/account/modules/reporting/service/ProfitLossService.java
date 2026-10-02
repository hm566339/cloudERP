package com.erp.account.modules.reporting.service;

import com.erp.account.modules.report.dto.response.ProfitLossResponse;
import com.erp.account.modules.reporting.dto.request.ProfitLossRequest;

public interface ProfitLossService {
    ProfitLossResponse generateProfitLoss(ProfitLossRequest request);
}
