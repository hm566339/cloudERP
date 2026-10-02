package com.erp.account.common.exception;
import com.erp.account.modules.auth.dto.ssoresponse.Status;


/**
 * Exception thrown when attempting to post an invoice that is already posted
 * 
 * HTTP Status: 409 Conflict
 */
public class SalesInvoiceAlreadyPostedException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public SalesInvoiceAlreadyPostedException(String message) {
        super(message, "SALES_INVOICE_ALREADY_POSTED");
    }

    public SalesInvoiceAlreadyPostedException(String message, Throwable cause) {
        super(message, cause, "SALES_INVOICE_ALREADY_POSTED");
    }

    public static SalesInvoiceAlreadyPostedException ofId(java.util.UUID invoiceId) {
        return new SalesInvoiceAlreadyPostedException(
            String.format("Sales invoice '%s' is already posted and cannot be modified", invoiceId)
        );
    }
}
