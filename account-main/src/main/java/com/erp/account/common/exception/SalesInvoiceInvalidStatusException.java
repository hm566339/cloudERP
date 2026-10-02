package com.erp.account.common.exception;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.auth.dto.ssoresponse.Status;


/**
 * Exception thrown when invoice status transition is invalid
 * 
 * Reasons:
 * - Cannot edit POSTED invoice
 * - Cannot post REJECTED invoice
 * - Cannot cancel PAID invoice
 * - Invalid status for requested operation
 * 
 * HTTP Status: 409 Conflict
 */
public class SalesInvoiceInvalidStatusException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public SalesInvoiceInvalidStatusException(String message) {
        super(message, "SALES_INVOICE_INVALID_STATUS");
    }

    public SalesInvoiceInvalidStatusException(String message, Throwable cause) {
        super(message, cause, "SALES_INVOICE_INVALID_STATUS");
    }

    public static SalesInvoiceInvalidStatusException cannotEdit(InvoiceStatus status) {
        return new SalesInvoiceInvalidStatusException(
            String.format("Cannot edit invoice in '%s' status. Only DRAFT and PENDING_APPROVAL can be edited.", status)
        );
    }

    public static SalesInvoiceInvalidStatusException cannotPost(InvoiceStatus status) {
        return new SalesInvoiceInvalidStatusException(
            String.format("Cannot post invoice in '%s' status. Only APPROVED invoices can be posted.", status)
        );
    }

    public static SalesInvoiceInvalidStatusException cannotCancel(InvoiceStatus status) {
        return new SalesInvoiceInvalidStatusException(
            String.format("Cannot cancel invoice in '%s' status. Cannot cancel PAID or CANCELLED invoices.", status)
        );
    }
}
