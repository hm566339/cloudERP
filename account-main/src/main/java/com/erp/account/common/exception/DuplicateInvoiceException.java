package com.erp.account.common.exception;
import com.erp.account.util.Invoice;


/**
 * Exception thrown when attempting to create a duplicate invoice number.
 * Invoice numbers must be unique per company.
 */
public class DuplicateInvoiceException extends ConflictException {

    private static final String ERROR_CODE = "DUPLICATE_INVOICE_NUMBER";

    public DuplicateInvoiceException(String invoiceNo, String companyId) {
        super(
            String.format(
                "Invoice number '%s' already exists for company: %s",
                invoiceNo,
                companyId
            ),
            ERROR_CODE
        );
    }

    public DuplicateInvoiceException(String message) {
        super(message, ERROR_CODE);
    }
}
