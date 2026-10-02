package com.erp.account.common.exception;

import java.util.UUID;
import com.erp.account.modules.customer.entity.Customer;


public class CustomerNotFoundException extends ResourceNotFoundException {

    private static final long serialVersionUID = 1L;

    public CustomerNotFoundException(UUID customerId) {
        super("Customer not found with ID: " + customerId, "CUSTOMER_NOT_FOUND");
    }

    public CustomerNotFoundException(String message) {
        super(message, "CUSTOMER_NOT_FOUND");
    }

    public CustomerNotFoundException(String message, String errorCode) {
        super(message, errorCode);
    }

    public static CustomerNotFoundException byId(UUID customerId) {
        return new CustomerNotFoundException(customerId);
    }

    public static CustomerNotFoundException byCode(String customerCode) {
        return new CustomerNotFoundException("Customer not found with code: " + customerCode);
    }
}
