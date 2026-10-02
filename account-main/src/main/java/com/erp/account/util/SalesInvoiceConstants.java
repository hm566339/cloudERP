package com.erp.account.util;
import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.customer.entity.Customer;


/**
 * Constants for Sales Invoice Module
 * 
 * Contains all fixed values, default settings, and business rule constants
 * used throughout the Sales Invoice management system.
 * 
 * Organized by functional area:
 * - Invoice number generation patterns
 * - GL account codes
 * - Tax rates and GST rules
 * - Date/time patterns
 * - Validation limits
 * - Business constants
 */
public class SalesInvoiceConstants {

    // ============================================================
    // INVOICE NUMBERING
    // ============================================================

    /** Invoice number prefix pattern (e.g., "INV-YYYY-") */
    public static final String INVOICE_NUMBER_PREFIX = "INV";

    /** Invoice number separator character */
    public static final String INVOICE_NUMBER_SEPARATOR = "-";

    /** Maximum length for invoice number field */
    public static final int INVOICE_NUMBER_MAX_LENGTH = 50;

    /** Pattern: YYYY-MM-DDHHMMSS for unique invoice identifiers */
    public static final String INVOICE_ID_PATTERN = "yyyyMMddHHmmss";

    // ============================================================
    // GL ACCOUNT CODES (to be configured per company)
    // ============================================================

    /** GL Account for Accounts Receivable (Customer Receivable) */
    public static final String GL_ACCOUNT_AR = "1100"; // Must be configured per company

    /** GL Account for Sales Revenue */
    public static final String GL_ACCOUNT_SALES_REVENUE = "4100";

    /** GL Account for Output GST/VAT */
    public static final String GL_ACCOUNT_OUTPUT_GST = "2200";

    /** GL Account for CGST Payable */
    public static final String GL_ACCOUNT_CGST_PAYABLE = "2210";

    /** GL Account for SGST Payable */
    public static final String GL_ACCOUNT_SGST_PAYABLE = "2220";

    /** GL Account for IGST Payable */
    public static final String GL_ACCOUNT_IGST_PAYABLE = "2230";

    // ============================================================
    // GST & TAX CONFIGURATION
    // ============================================================

    /** Standard GST rate (18%) */
    public static final java.math.BigDecimal STANDARD_GST_RATE = new java.math.BigDecimal("18.00");

    /** Reduced GST rate (5%) */
    public static final java.math.BigDecimal REDUCED_GST_RATE = new java.math.BigDecimal("5.00");

    /** Zero GST rate (0%) */
    public static final java.math.BigDecimal ZERO_GST_RATE = java.math.BigDecimal.ZERO;

    /** CGST rate for standard tax (9% of 18%) */
    public static final java.math.BigDecimal CGST_RATE_STANDARD = new java.math.BigDecimal("9.00");

    /** SGST rate for standard tax (9% of 18%) */
    public static final java.math.BigDecimal SGST_RATE_STANDARD = new java.math.BigDecimal("9.00");

    /** IGST rate for standard tax (18%) */
    public static final java.math.BigDecimal IGST_RATE_STANDARD = new java.math.BigDecimal("18.00");

    /** Maximum GST rate allowed (typically 28%) */
    public static final java.math.BigDecimal MAX_GST_RATE = new java.math.BigDecimal("28.00");

    /** Minimum GST rate allowed (0%) */
    public static final java.math.BigDecimal MIN_GST_RATE = java.math.BigDecimal.ZERO;

    // ============================================================
    // MONETARY PRECISION
    // ============================================================

    /** Scale for amount fields: 4 decimal places (e.g., 1234.5678) */
    public static final int AMOUNT_SCALE = 4;

    /** Scale for exchange rate: 6 decimal places (e.g., 1.234567) */
    public static final int EXCHANGE_RATE_SCALE = 6;

    /** Rounding mode for calculations (HALF_UP per GST compliance) */
    public static final java.math.RoundingMode ROUNDING_MODE = java.math.RoundingMode.HALF_UP;

    /** Minimum invoice amount allowed */
    public static final java.math.BigDecimal MIN_INVOICE_AMOUNT = java.math.BigDecimal.ZERO;

    /** Maximum invoice amount allowed (typically unlimited, but set for validation) */
    public static final java.math.BigDecimal MAX_INVOICE_AMOUNT = new java.math.BigDecimal("999999999.9999");

    // ============================================================
    // AGING BUCKETS (in days)
    // ============================================================

    /** Aging bucket: 0-30 days (current) */
    public static final String AGING_BUCKET_CURRENT = "0-30 Days";

    public static final int AGING_BUCKET_CURRENT_MIN = 0;
    public static final int AGING_BUCKET_CURRENT_MAX = 30;

    /** Aging bucket: 31-60 days */
    public static final String AGING_BUCKET_30_PLUS = "31-60 Days";

    public static final int AGING_BUCKET_30_PLUS_MIN = 31;
    public static final int AGING_BUCKET_30_PLUS_MAX = 60;

    /** Aging bucket: 61-90 days */
    public static final String AGING_BUCKET_60_PLUS = "61-90 Days";

    public static final int AGING_BUCKET_60_PLUS_MIN = 61;
    public static final int AGING_BUCKET_60_PLUS_MAX = 90;

    /** Aging bucket: 90+ days (overdue) */
    public static final String AGING_BUCKET_90_PLUS = "90+ Days";

    public static final int AGING_BUCKET_90_PLUS_MIN = 91;
    public static final int AGING_BUCKET_90_PLUS_MAX = Integer.MAX_VALUE;

    // ============================================================
    // PAYMENT STATUS (derived from amounts)
    // ============================================================

    /** Payment status: Invoice not yet paid */
    public static final String PAYMENT_STATUS_UNPAID = "UNPAID";

    /** Payment status: Invoice partially paid */
    public static final String PAYMENT_STATUS_PARTIALLY_PAID = "PARTIALLY_PAID";

    /** Payment status: Invoice fully paid */
    public static final String PAYMENT_STATUS_PAID = "PAID";

    /** Threshold for partial payment (receivedAmount > 0 && < totalAmount) */
    public static final java.math.BigDecimal PARTIAL_PAYMENT_THRESHOLD = java.math.BigDecimal.ONE;

    // ============================================================
    // CURRENCY SETTINGS
    // ============================================================

    /** Default currency for India (INR) */
    public static final String DEFAULT_CURRENCY = "INR";

    /** Maximum length for currency code (ISO 4217: 3 characters) */
    public static final int CURRENCY_CODE_LENGTH = 3;

    /** Minimum exchange rate value */
    public static final java.math.BigDecimal MIN_EXCHANGE_RATE = new java.math.BigDecimal("0.000001");

    /** Maximum exchange rate value (typically 1000000) */
    public static final java.math.BigDecimal MAX_EXCHANGE_RATE = new java.math.BigDecimal("999999.999999");

    // ============================================================
    // VALIDATION CONSTRAINTS
    // ============================================================

    /** Maximum length for invoice description */
    public static final int INVOICE_DESCRIPTION_MAX_LENGTH = 1000;

    /** Maximum length for place of supply (state/country code) */
    public static final int PLACE_OF_SUPPLY_MAX_LENGTH = 2;

    /** Maximum quantity per line item */
    public static final java.math.BigDecimal MAX_ITEM_QUANTITY = new java.math.BigDecimal("999999.9999");

    /** Minimum quantity per line item (> 0) */
    public static final java.math.BigDecimal MIN_ITEM_QUANTITY = new java.math.BigDecimal("0.0001");

    /** Maximum unit price */
    public static final java.math.BigDecimal MAX_UNIT_PRICE = new java.math.BigDecimal("999999.9999");

    /** Minimum unit price (can be 0) */
    public static final java.math.BigDecimal MIN_UNIT_PRICE = java.math.BigDecimal.ZERO;

    // ============================================================
    // CREDIT LIMIT & AR RULES
    // ============================================================

    /** Default credit limit for new customers */
    public static final java.math.BigDecimal DEFAULT_CREDIT_LIMIT = new java.math.BigDecimal("100000.00");

    /** Percentage threshold for credit limit warning (80%) */
    public static final java.math.BigDecimal CREDIT_LIMIT_WARNING_PERCENTAGE = new java.math.BigDecimal("80");

    /** Overdue period in days (days > dueDate) */
    public static final int OVERDUE_THRESHOLD_DAYS = 0; // Any day past due date

    // ============================================================
    // TIME CONSTRAINTS
    // ============================================================

    /** Default credit period in days from invoice date */
    public static final int DEFAULT_CREDIT_PERIOD_DAYS = 30;

    /** Minimum invoice date: cannot be more than 1 year in the past */
    public static final int INVOICE_DATE_MIN_DAYS_BACK = -365;

    /** Maximum invoice date: cannot be in the future */
    public static final int INVOICE_DATE_MAX_DAYS_FUTURE = 0;

    // ============================================================
    // DATABASE COLUMN CONSTRAINTS
    // ============================================================

    /** Precision for amount fields in database */
    public static final int DB_AMOUNT_PRECISION = 19;

    /** Scale for amount fields in database */
    public static final int DB_AMOUNT_SCALE = 4;

    /** Precision for exchange rate in database */
    public static final int DB_EXCHANGE_RATE_PRECISION = 19;

    /** Scale for exchange rate in database */
    public static final int DB_EXCHANGE_RATE_SCALE = 6;

    // ============================================================
    // LEDGER & POSTING
    // ============================================================

    /** Description for GL entry created from sales invoice */
    public static final String GL_ENTRY_DESCRIPTION_PREFIX = "Sales Invoice";

    /** Narration format for GL journal line */
    public static final String GL_NARRATION_FORMAT = "Sales Invoice: %s | Customer: %s | Date: %s";

    // ============================================================
    // BUSINESS RULES
    // ============================================================

    /** Maximum number of line items per invoice */
    public static final int MAX_LINE_ITEMS = 999;

    /** Minimum number of line items per invoice */
    public static final int MIN_LINE_ITEMS = 1;

    /** Cannot create invoice with past date (requires special authorization) */
    public static final boolean ALLOW_BACKDATED_INVOICES = false;

    /** Can invoice be partially paid before approval */
    public static final boolean ALLOW_PAYMENT_BEFORE_APPROVAL = false;

    /** Require customer GSTIN for all invoices */
    public static final boolean REQUIRE_CUSTOMER_GSTIN = true;

    /** Require place of supply for all invoices */
    public static final boolean REQUIRE_PLACE_OF_SUPPLY = true;

    // ============================================================
    // ERROR MESSAGES
    // ============================================================

    public static final String ERR_INVOICE_NOT_FOUND = "Sales invoice not found";
    public static final String ERR_CUSTOMER_NOT_FOUND = "Customer not found";
    public static final String ERR_COMPANY_NOT_FOUND = "Company not found";
    public static final String ERR_DUPLICATE_INVOICE_NUMBER = "Invoice number already exists";
    public static final String ERR_INVALID_CUSTOMER = "Customer is inactive or deleted";
    public static final String ERR_INVALID_DATE_RANGE = "Invoice date must be before due date";
    public static final String ERR_INVALID_AMOUNT = "Amount must be positive";
    public static final String ERR_TAX_CALCULATION_MISMATCH = "Tax calculation does not match specified amount";
    public static final String ERR_INVOICE_NOT_APPROVED = "Invoice must be approved before posting";
    public static final String ERR_INVOICE_ALREADY_POSTED = "Invoice is already posted";
    public static final String ERR_PAYMENT_EXCEEDS_OUTSTANDING = "Payment amount exceeds outstanding balance";
    public static final String ERR_ACCOUNTING_PERIOD_CLOSED = "Accounting period is closed";
    public static final String ERR_CROSS_COMPANY_ACCESS = "Cross-company access denied";
    public static final String ERR_INVALID_CURRENCY = "Invalid currency code";
    public static final String ERR_INVALID_EXCHANGE_RATE = "Exchange rate must be positive";

    // ============================================================
    // SUCCESS MESSAGES
    // ============================================================

    public static final String MSG_INVOICE_CREATED = "Sales invoice created successfully";
    public static final String MSG_INVOICE_UPDATED = "Sales invoice updated successfully";
    public static final String MSG_INVOICE_DELETED = "Sales invoice deleted successfully";
    public static final String MSG_INVOICE_APPROVED = "Sales invoice approved successfully";
    public static final String MSG_INVOICE_POSTED = "Sales invoice posted to GL successfully";
    public static final String MSG_PAYMENT_RECORDED = "Payment recorded successfully";
    public static final String MSG_INVOICE_CANCELLED = "Sales invoice cancelled successfully";

    // ============================================================
    // API ENDPOINTS
    // ============================================================

    public static final String API_BASE_PATH = "/api/sales/invoices";
    public static final String API_INVOICES_LISTING = "";
    public static final String API_INVOICE_CREATE = "";
    public static final String API_INVOICE_GET = "/{id}";
    public static final String API_INVOICE_UPDATE = "/{id}";
    public static final String API_INVOICE_DELETE = "/{id}";
    public static final String API_INVOICE_BY_NUMBER = "/number/{invoiceNumber}";
    public static final String API_INVOICE_APPROVE = "/{id}/approve";
    public static final String API_INVOICE_REJECT = "/{id}/reject";
    public static final String API_INVOICE_POST = "/{id}/post";
    public static final String API_INVOICE_CANCEL = "/{id}/cancel";
    public static final String API_INVOICE_PAY = "/{id}/pay";
    public static final String API_OUTSTANDING_INVOICES = "/outstanding";
    public static final String API_OVERDUE_INVOICES = "/overdue";
    public static final String API_AGING_REPORT = "/aging";

    // ============================================================
    // PREVENT INSTANTIATION
    // ============================================================

    private SalesInvoiceConstants() {
        throw new AssertionError("Constants utility class cannot be instantiated");
    }
}
