package com.erp.account.common.exception;

import java.util.UUID;

public class DuplicateVendorCodeException extends DuplicateResourceException {

    public DuplicateVendorCodeException(String vendorCode, UUID companyId) {
        super("Vendor code '" + vendorCode + "' already exists for company: " + companyId);
    }

    public DuplicateVendorCodeException(String message) {
        super(message);
    }
}
