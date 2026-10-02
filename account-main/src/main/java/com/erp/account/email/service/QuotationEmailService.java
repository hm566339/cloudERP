package com.erp.account.email.service;

import com.erp.account.modules.quotation.entity.Quotation;

public interface QuotationEmailService {

    /**
     * Prepares and sends a professional quotation email with the PDF attached.
     * Extracts necessary company and customer data from the quotation.
     * 
     * @param quotation The quotation entity
     * @param pdfBytes  The generated PDF file bytes to attach
     */
    void sendQuotationEmail(Quotation quotation, byte[] pdfBytes);

}
