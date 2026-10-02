package com.erp.account.common.exception;

/**
 * Exception thrown when vendor validation fails
 * 
 * Reasons:
 * - Vendor not found
 * - Vendor inactive
 * - Vendor deleted
 * - Vendor not in same company
 */
public class InvalidVendorException extends BadRequestException {
    public InvalidVendorException(String vendorId) {
        super("Invalid or inactive vendor: " + vendorId, "INVALID_VENDOR");
    }

    public InvalidVendorException(String message, String errorCode) {
        super(message, errorCode);
    }
}
