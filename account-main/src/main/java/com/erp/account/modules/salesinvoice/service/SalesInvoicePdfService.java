package com.erp.account.modules.salesinvoice.service;

import java.util.UUID;

public interface SalesInvoicePdfService {
    byte[] generateSalesInvoicePdf(UUID invoiceId, UUID companyId);
    
    /**
     * Generates a PDF for a public link, bypassing company security checks.
     * The UUID acts as the secure token.
     */
    byte[] generatePublicSalesInvoicePdf(UUID invoiceId);
}
