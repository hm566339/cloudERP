package com.erp.account.common.exception;
import com.erp.account.modules.customer.entity.Customer;


public class DuplicateCustomerCodeException extends BadRequestException {

    private static final long serialVersionUID = 1L;

    public DuplicateCustomerCodeException(String customerCode) {
        super("Customer code '" + customerCode + "' already exists in this company", "DUPLICATE_CUSTOMER_CODE");
    }

    public DuplicateCustomerCodeException(String message, String errorCode) {
        super(message, errorCode);
    }
}
