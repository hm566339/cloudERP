package com.erp.account.common.exception;
import com.erp.account.modules.auth.dto.ssoresponse.Status;
import com.erp.account.util.Invoice;


/**
 * Exception thrown when attempting to create invoice with duplicate invoice number
 * 
 * Invoice number must be unique per company.
 * 
 * HTTP Status: 409 Conflict
 */
public class SalesInvoiceDuplicateException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public SalesInvoiceDuplicateException(String message) {
        super(message, "DUPLICATE_SALES_INVOICE");
    }

    public SalesInvoiceDuplicateException(String message, Throwable cause) {
        super(message, cause, "DUPLICATE_SALES_INVOICE");
    }

    public static SalesInvoiceDuplicateException ofInvoiceNumber(String invoiceNumber, java.util.UUID companyId) {
        return new SalesInvoiceDuplicateException(
            String.format("Sales invoice number '%s' already exists in company '%s'", invoiceNumber, companyId)
        );
    }
}
