package com.erp.account.util;

import java.math.BigDecimal;
import com.erp.account.modules.vendor.entity.Vendor;


public final class VendorConstants {
    private VendorConstants() {}

    // GSTIN: 15 chars, pattern: 2 digits state code, 10 PAN chars, 1 entity code, 1 Z, 1 checksum
    public static final String GSTIN_REGEX = "^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$";
    public static final String PAN_REGEX = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$";

    // Constants
    public static final int VENDOR_CODE_MAX_LENGTH = 50;
    public static final int VENDOR_NAME_MAX_LENGTH = 255;
    public static final int ADDRESS_MAX_LENGTH = 500;
    public static final int CITY_MAX_LENGTH = 100;
    public static final int STATE_MAX_LENGTH = 100;
    public static final int COUNTRY_MAX_LENGTH = 100;
    public static final int PIN_CODE_MAX_LENGTH = 10;
    public static final int GSTIN_LENGTH = 15;
    public static final int PAN_LENGTH = 10;

    // Error Messages
    public static final String VENDOR_NOT_FOUND = "Vendor not found";
    public static final String DUPLICATE_VENDOR_CODE = "Vendor code already exists for this company";
    public static final String INVALID_GSTIN = "Invalid GSTIN format";
    public static final String INVALID_PAN = "Invalid PAN format";
    public static final String VENDOR_INACTIVE = "Vendor is inactive";
    public static final String VENDOR_DELETED = "Vendor has been deleted";
    public static final String VENDOR_HAS_TRANSACTIONS = "Cannot delete vendor with active transactions";
    public static final String CREDIT_LIMIT_EXCEEDED = "Credit limit exceeded";
    public static final String NEGATIVE_CREDIT_LIMIT = "Credit limit cannot be negative";
    public static final String INVALID_EMAIL = "Invalid email format";
    public static final String INVALID_PHONE = "Invalid phone format";

    // Default Values
    public static final BigDecimal DEFAULT_CREDIT_LIMIT = BigDecimal.ZERO;
    public static final Boolean DEFAULT_IS_ACTIVE = true;
}
