package com.erp.account.modules.apinvoice.service;

import java.util.UUID;

public interface ApInvoicePdfService {
    byte[] generateApInvoicePdf(UUID invoiceId, UUID companyId);
    
    /**
     * Generates a PDF for a public link, bypassing company security checks.
     * The UUID acts as the secure token.
     */
    byte[] generatePublicApInvoicePdf(UUID invoiceId);
}
