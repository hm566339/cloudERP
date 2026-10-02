package com.erp.account.modules.rfq.service;

import com.erp.account.modules.rfq.dto.RfqEmailDispatchResponse;

import java.util.UUID;

public interface RfqEmailService {
    /**
     * Dispatches RFQ emails to all associated vendors.
     * Generates PDF for each vendor and sends an email.
     * @param companyId The tenant company ID
     * @param rfqId The ID of the RFQ
     * @return Detailed result of the dispatch operation
     */
    RfqEmailDispatchResponse dispatchRfqEmails(UUID companyId, UUID rfqId);
}
