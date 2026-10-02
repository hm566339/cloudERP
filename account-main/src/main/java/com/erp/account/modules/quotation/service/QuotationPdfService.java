package com.erp.account.modules.quotation.service;

import java.util.UUID;

public interface QuotationPdfService {

    byte[] generateQuotationPdf(UUID quotationId, UUID companyId);

    byte[] generatePublicQuotationPdf(UUID quotationId);
}
