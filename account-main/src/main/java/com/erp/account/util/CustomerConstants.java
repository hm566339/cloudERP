package com.erp.account.util;
import com.erp.account.modules.customer.entity.Customer;


public class CustomerConstants {

    private CustomerConstants() {
        // Constants class
    }

    // Validation Constants
    public static final int CUSTOMER_CODE_MIN_LENGTH = 2;
    public static final int CUSTOMER_CODE_MAX_LENGTH = 50;
    public static final int CUSTOMER_NAME_MIN_LENGTH = 2;
    public static final int CUSTOMER_NAME_MAX_LENGTH = 200;
    public static final int GSTIN_LENGTH = 15;
    public static final int PAN_LENGTH = 10;
    public static final int PHONE_LENGTH = 10;

    // Error Messages
    public static final String CUSTOMER_CODE_REQUIRED = "Customer code is required";
    public static final String CUSTOMER_NAME_REQUIRED = "Customer name is required";
    public static final String DUPLICATE_CUSTOMER_CODE = "Customer code already exists in this company";
    public static final String INVALID_EMAIL = "Invalid email format";
    public static final String INVALID_PHONE = "Phone must be 10 digits";
    public static final String INVALID_GSTIN = "Invalid GSTIN format";
    public static final String INVALID_PAN = "Invalid PAN format";
    public static final String CREDIT_LIMIT_NEGATIVE = "Credit limit cannot be negative";
    public static final String CUSTOMER_NOT_FOUND = "Customer not found";
    public static final String CUSTOMER_INACTIVE = "Customer is inactive";
    public static final String CUSTOMER_DELETED = "Customer has been deleted";
    public static final String CUSTOMER_TRANSACTION_EXISTS = "Cannot delete customer with existing transactions";
}
