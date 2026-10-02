package com.erp.account.common.exception;

import java.util.UUID;

public class VendorInactiveException extends BusinessException {

    public VendorInactiveException(UUID vendorId) {
        super("Vendor with id " + vendorId + " is inactive and cannot be used for transactions");
    }

    public VendorInactiveException(String vendorCode) {
        super("Vendor " + vendorCode + " is inactive and cannot be used for transactions");
    }
}
