package com.erp.account.common.exception;

import java.util.UUID;

/**
 * Exception thrown when duplicate UTR number is detected.
 * 
 * @author ERP System
 * @version 1.0
 */
public class DuplicateUtrException extends RuntimeException {

    private final String utrNo;
    private final UUID companyId;

    public DuplicateUtrException(String utrNo, UUID companyId) {
        super("Duplicate UTR number '" + utrNo + "' already exists for company: " + companyId);
        this.utrNo = utrNo;
        this.companyId = companyId;
    }

    public String getUtrNo() {
        return utrNo;
    }

    public UUID getCompanyId() {
        return companyId;
    }
}
