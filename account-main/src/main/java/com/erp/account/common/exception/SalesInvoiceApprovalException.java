package com.erp.account.common.exception;
import com.erp.account.modules.auth.dto.ssoresponse.Status;
import com.erp.account.util.Invoice;


/**
 * Exception thrown when approval workflow operation fails on invoice
 * 
 * Reasons:
 * - Invoice not in PENDING_APPROVAL status
 * - Approval not authorized
 * - Invoice status invalid for operation
 * 
 * HTTP Status: 409 Conflict
 */
public class SalesInvoiceApprovalException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public SalesInvoiceApprovalException(String message) {
        super(message, "SALES_INVOICE_APPROVAL_ERROR");
    }

    public SalesInvoiceApprovalException(String message, Throwable cause) {
        super(message, cause, "SALES_INVOICE_APPROVAL_ERROR");
    }

    public static SalesInvoiceApprovalException notPendingApproval(java.util.UUID invoiceId) {
        return new SalesInvoiceApprovalException(
            String.format("Invoice '%s' is not in PENDING_APPROVAL status", invoiceId)
        );
    }

    public static SalesInvoiceApprovalException alreadyApproved(java.util.UUID invoiceId) {
        return new SalesInvoiceApprovalException(
            String.format("Invoice '%s' has already been approved", invoiceId)
        );
    }
}
