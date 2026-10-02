package com.erp.account.common.exception;

import java.util.UUID;

public class VendorDeletedException extends BusinessException {

    public VendorDeletedException(UUID vendorId) {
        super("Vendor with id " + vendorId + " has been deleted and cannot be accessed");
    }

    public VendorDeletedException(String vendorCode) {
        super("Vendor " + vendorCode + " has been deleted and cannot be accessed");
    }
}
