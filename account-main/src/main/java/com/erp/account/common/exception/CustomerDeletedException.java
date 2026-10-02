package com.erp.account.common.exception;



public class CustomerDeletedException extends BadRequestException {

    private static final long serialVersionUID = 1L;

    public CustomerDeletedException(String customerName) {
        super("Customer '" + customerName + "' has been deleted and cannot be used", "CUSTOMER_DELETED");
    }

    public CustomerDeletedException(String message, String errorCode) {
        super(message, errorCode);
    }
}
