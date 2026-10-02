package com.erp.account.modules.banktransaction.service;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Service for generating Bank Ledger PDF
 */
public interface BankLedgerPdfService {
    
    /**
     * Generates a PDF byte array for the bank ledger
     * 
     * @param bankAccountId the bank account ID
     * @param startDate the start date
     * @param endDate the end date
     * @param companyId the company ID
     * @return PDF byte array
     */
    byte[] generateBankLedgerPdf(UUID bankAccountId, LocalDate startDate, LocalDate endDate, UUID companyId);
}
