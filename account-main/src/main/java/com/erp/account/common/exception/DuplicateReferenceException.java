package com.erp.account.common.exception;

import java.util.UUID;

/**
 * Exception thrown when duplicate reference number is detected.
 * 
 * @author ERP System
 * @version 1.0
 */
public class DuplicateReferenceException extends RuntimeException {

    private final String referenceNo;
    private final UUID companyId;

    public DuplicateReferenceException(String referenceNo, UUID companyId) {
        super("Duplicate reference number '" + referenceNo + "' already exists for company: " + companyId);
        this.referenceNo = referenceNo;
        this.companyId = companyId;
    }

    public String getReferenceNo() {
        return referenceNo;
    }

    public UUID getCompanyId() {
        return companyId;
    }
}
