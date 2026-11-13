package com.erp.account.modules.quotation.service;

import com.erp.account.modules.quotation.entity.Quotation;
import com.erp.account.modules.quotation.dto.response.QuotationAcceptResponse;
import com.erp.account.modules.quotation.dto.response.QuotationPublicViewResponse;
import com.erp.account.modules.quotation.dto.response.QuotationRejectResponse;

import java.util.UUID;

public interface QuotationAcceptanceTokenService {
    String generateToken(Quotation quotation);
    String getOrCreateToken(Quotation quotation);
    QuotationAcceptResponse acceptQuotation(String rawToken);
    QuotationRejectResponse rejectQuotation(String rawToken, String reason);
    QuotationPublicViewResponse getPublicQuotation(String rawToken);
    void revokeToken(String rawToken);
    void revokeTokensForQuotation(UUID quotationId);
}
