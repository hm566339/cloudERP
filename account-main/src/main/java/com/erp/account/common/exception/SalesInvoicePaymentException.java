package com.erp.account.common.exception;
import com.erp.account.modules.auth.dto.ssoresponse.Status;
import com.erp.account.util.Invoice;


/**
 * Exception thrown when payment operation on invoice fails
 * 
 * Reasons:
 * - Payment amount exceeds outstanding balance
 * - Invoice is already fully paid
 * - Invoice is cancelled/rejected
 * - Payment state is invalid
 * 
 * HTTP Status: 400 Bad Request
 */
public class SalesInvoicePaymentException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public SalesInvoicePaymentException(String message) {
        super(message, "SALES_INVOICE_PAYMENT_ERROR");
    }

    public SalesInvoicePaymentException(String message, Throwable cause) {
        super(message, cause, "SALES_INVOICE_PAYMENT_ERROR");
    }

    public static SalesInvoicePaymentException excessivePayment(java.math.BigDecimal amount, java.math.BigDecimal outstanding) {
        return new SalesInvoicePaymentException(
            String.format("Payment amount %.2f exceeds outstanding balance %.2f", amount, outstanding)
        );
    }

    public static SalesInvoicePaymentException alreadyPaid(java.util.UUID invoiceId) {
        return new SalesInvoicePaymentException(
            String.format("Invoice '%s' is already fully paid", invoiceId)
        );
    }
}
