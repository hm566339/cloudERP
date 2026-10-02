package com.erp.account.modules.quotation.service;

import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;

public interface QuotationAcceptanceTokenService {
    String generateToken(Quotation quotation);
    QuotationAcceptResponse acceptQuotation(String rawToken);
    void revokeToken(String rawToken);
}
