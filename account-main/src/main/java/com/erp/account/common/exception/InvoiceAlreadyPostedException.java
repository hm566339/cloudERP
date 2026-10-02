package com.erp.account.common.exception;
import com.erp.account.util.Invoice;


/**
 * Exception thrown when attempting to modify an already posted invoice
 * 
 * Posted invoices are immutable and cannot be edited or deleted
 */
public class InvoiceAlreadyPostedException extends BusinessException {
    public InvoiceAlreadyPostedException(String invoiceNo) {
        super("Invoice " + invoiceNo + " has already been posted and cannot be modified", 
              "INVOICE_ALREADY_POSTED");
    }

    public InvoiceAlreadyPostedException(String message, String errorCode) {
        super(message, errorCode);
    }
}
