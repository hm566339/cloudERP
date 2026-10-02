package com.erp.account.modules.reporting.service;

import com.erp.account.modules.report.dto.response.GeneralLedgerResponse;
import com.erp.account.modules.reporting.dto.request.GeneralLedgerRequest;
import java.util.UUID;

public interface GeneralLedgerService {
    GeneralLedgerResponse generateGeneralLedger(GeneralLedgerRequest request, UUID companyId);
}
