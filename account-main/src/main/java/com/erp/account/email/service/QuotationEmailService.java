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

    /**
     * Prepares and sends a quotation email with an explicit raw acceptance token shared with the PDF.
     *
     * @param quotation The quotation entity
     * @param pdfBytes  The generated PDF file bytes to attach
     * @param rawToken  The raw token to embed in the email acceptance URL
     */
    void sendQuotationEmail(Quotation quotation, byte[] pdfBytes, String rawToken);
}
