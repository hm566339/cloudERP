package com.erp.account.common.exception;
import com.erp.account.modules.auth.dto.ssoresponse.Status;


/**
 * Exception thrown when a sales invoice is not found
 * 
 * HTTP Status: 404 Not Found
 */
public class SalesInvoiceNotFoundException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public SalesInvoiceNotFoundException(String message) {
        super(message, "SALES_INVOICE_NOT_FOUND");
    }

    public SalesInvoiceNotFoundException(String message, Throwable cause) {
        super(message, cause, "SALES_INVOICE_NOT_FOUND");
    }

    public static SalesInvoiceNotFoundException ofId(java.util.UUID invoiceId) {
        return new SalesInvoiceNotFoundException(
            String.format("Sales invoice with ID '%s' not found", invoiceId)
        );
    }

    public static SalesInvoiceNotFoundException ofNumber(String invoiceNumber) {
        return new SalesInvoiceNotFoundException(
            String.format("Sales invoice with number '%s' not found", invoiceNumber)
        );
    }
}
