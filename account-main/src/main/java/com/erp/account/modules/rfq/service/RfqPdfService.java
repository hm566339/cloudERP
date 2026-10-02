package com.erp.account.modules.rfq.service;

import com.erp.account.modules.rfq.entity.Rfq;
import com.erp.account.modules.vendor.entity.Vendor;

public interface RfqPdfService {

    /**
     * Generates a PDF byte array for a given RFQ and targeted Vendor.
     *
     * @param rfq    The RFQ entity
     * @param vendor The recipient vendor entity
     * @return byte array containing the rendered PDF
     */
    byte[] generateRfqPdf(Rfq rfq, Vendor vendor);

    /**
     * Generates a PDF byte array for a given RFQ email model, Vendor, and Company.
     *
     * @param model   The RFQ email model DTO
     * @param vendor  The recipient vendor entity
     * @param company The company entity
     * @return byte array containing the rendered PDF
     */
    byte[] generateRfqPdf(com.erp.account.modules.rfq.dto.RfqEmailModel model, Vendor vendor, com.erp.account.modules.company.entity.Company company);
}
