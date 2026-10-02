package com.erp.account.common.exception;
import com.erp.account.modules.auth.dto.ssoresponse.Status;


/**
 * Exception thrown when tax calculation or tax data is invalid on invoice
 * 
 * Reasons:
 * - Tax amount doesn't match calculated amount
 * - Invalid GST rate
 * - Invalid CGST/SGST/IGST combination
 * - Invalid place of supply
 * - Invalid taxable amount
 * 
 * HTTP Status: 400 Bad Request
 */
public class SalesInvoiceInvalidTaxException extends BaseApplicationException {

    private static final long serialVersionUID = 1L;

    public SalesInvoiceInvalidTaxException(String message) {
        super(message, "SALES_INVOICE_INVALID_TAX");
    }

    public SalesInvoiceInvalidTaxException(String message, Throwable cause) {
        super(message, cause, "SALES_INVOICE_INVALID_TAX");
    }

    public static SalesInvoiceInvalidTaxException taxMismatch(java.math.BigDecimal expected, java.math.BigDecimal actual) {
        return new SalesInvoiceInvalidTaxException(
            String.format("Tax amount mismatch. Expected: %.2f, Actual: %.2f", expected, actual)
        );
    }

    public static SalesInvoiceInvalidTaxException invalidRate(java.math.BigDecimal rate) {
        return new SalesInvoiceInvalidTaxException(
            String.format("Invalid tax rate: %.2f. Rate must be between 0 and 100.", rate)
        );
    }
}
