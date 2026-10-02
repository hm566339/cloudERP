package com.erp.account.common.exception;

import java.util.UUID;

public class VendorTransactionExistsException extends ConflictException {

    public VendorTransactionExistsException(UUID vendorId) {
        super("Cannot delete vendor with id " + vendorId + " because it has active invoices or payments");
    }

    public VendorTransactionExistsException(String vendorCode) {
        super("Cannot delete vendor " + vendorCode + " because it has active invoices or payments");
    }
}
