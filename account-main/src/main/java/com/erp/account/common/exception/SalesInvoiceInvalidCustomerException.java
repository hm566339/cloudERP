package com.erp.account.common.exception;
import com.erp.account.modules.auth.dto.ssoresponse.Status;
import com.erp.account.modules.customer.entity.Customer;


/**
 * Exception thrown when customer for sales invoice is invalid
 * 
 * Reasons:
 * - Customer does not exist
 * - Customer is inactive/deleted
 * - Customer belongs to different company
 * - Customer GSTIN invalid
 * - Credit limit exceeded
 * 
 * HTTP Status: 400 Bad Request or 404 Not Found
 */
public class SalesInvoiceInvalidCustomerException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public SalesInvoiceInvalidCustomerException(String message) {
        super(message, "SALES_INVOICE_INVALID_CUSTOMER");
    }

    public SalesInvoiceInvalidCustomerException(String message, Throwable cause) {
        super(message, cause, "SALES_INVOICE_INVALID_CUSTOMER");
    }

    public static SalesInvoiceInvalidCustomerException notFound(java.util.UUID customerId) {
        return new SalesInvoiceInvalidCustomerException(
            String.format("Customer '%s' does not exist", customerId)
        );
    }

    public static SalesInvoiceInvalidCustomerException inactive(java.util.UUID customerId) {
        return new SalesInvoiceInvalidCustomerException(
            String.format("Customer '%s' is inactive and cannot receive invoices", customerId)
        );
    }

    public static SalesInvoiceInvalidCustomerException deleted(java.util.UUID customerId) {
        return new SalesInvoiceInvalidCustomerException(
            String.format("Customer '%s' has been deleted", customerId)
        );
    }

    public static SalesInvoiceInvalidCustomerException wrongCompany(java.util.UUID customerId, java.util.UUID companyId) {
        return new SalesInvoiceInvalidCustomerException(
            String.format("Customer '%s' does not belong to company '%s'", customerId, companyId)
        );
    }

    public static SalesInvoiceInvalidCustomerException creditLimitExceeded(java.util.UUID customerId, java.math.BigDecimal outstanding, java.math.BigDecimal limit) {
        return new SalesInvoiceInvalidCustomerException(
            String.format("Customer '%s' credit limit exceeded. Outstanding: %.2f, Limit: %.2f", customerId, outstanding, limit)
        );
    }
}
