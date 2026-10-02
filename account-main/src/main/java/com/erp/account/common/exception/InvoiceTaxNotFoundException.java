package com.erp.account.common.exception;

public class InvoiceTaxNotFoundException extends ResourceNotFoundException {

    private static final long serialVersionUID = 1L;

    public InvoiceTaxNotFoundException(String message) {
        super(message);
    }

    public InvoiceTaxNotFoundException(String message, String errorCode) {
        super(message, errorCode);
    }
}
