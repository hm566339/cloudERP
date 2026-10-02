package com.erp.account.common.exception;



public class CustomerInactiveException extends BadRequestException {

    private static final long serialVersionUID = 1L;

    public CustomerInactiveException(String customerName) {
        super("Customer '" + customerName + "' is inactive and cannot be used", "CUSTOMER_INACTIVE");
    }

    public CustomerInactiveException(String message, String errorCode) {
        super(message, errorCode);
    }
}
