package com.erp.account.common.exception;
import com.erp.account.util.Invoice;


/**
 * Exception thrown during invoice approval operations
 * 
 * Reasons:
 * - Insufficient permissions to approve
 * - Invoice not in approvable status
 * - Approval workflow violation
 */
public class InvoiceApprovalException extends BusinessException {
    public InvoiceApprovalException(String message) {
        super(message, "INVOICE_APPROVAL_FAILED");
    }

    public InvoiceApprovalException(String message, String errorCode) {
        super(message, errorCode);
    }
}
