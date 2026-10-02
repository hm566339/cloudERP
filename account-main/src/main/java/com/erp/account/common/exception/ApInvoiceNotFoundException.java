package com.erp.account.common.exception;



/**
 * Exception thrown when an AP Invoice is not found
 */
public class ApInvoiceNotFoundException extends ResourceNotFoundException {
    public ApInvoiceNotFoundException(String invoiceId) {
        super("AP Invoice not found with ID: " + invoiceId, "AP_INVOICE_NOT_FOUND");
    }

    public ApInvoiceNotFoundException(String message, String errorCode) {
        super(message, errorCode);
    }
}
