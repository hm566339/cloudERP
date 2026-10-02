package com.erp.account.common.exception;

import java.util.UUID;

public class VendorNotFoundException extends RuntimeException {

    public VendorNotFoundException(String message) {
        super(message);
    }

    public static VendorNotFoundException byCode(String vendorCode) {
        return new VendorNotFoundException(
            "Vendor not found with code: " + vendorCode
        );
    }

    public static VendorNotFoundException byId(UUID vendorId) {
        return new VendorNotFoundException(
            "Vendor not found with id: " + vendorId
        );
    }
}
