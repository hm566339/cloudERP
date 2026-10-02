package com.erp.account.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

/**
 * Constants for AP Invoice Module
 * 
 * Contains business rule constants, error codes, status values,
 * and other configuration parameters
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class ApInvoiceConstants {

    // ============================================================
    // INVOICE STATUS CONSTANTS
    // ============================================================

    public static final String INVOICE_STATUS_DRAFT = "DRAFT";
    public static final String INVOICE_STATUS_PENDING_APPROVAL = "PENDING_APPROVAL";
    public static final String INVOICE_STATUS_APPROVED = "APPROVED";
    public static final String INVOICE_STATUS_POSTED = "POSTED";
    public static final String INVOICE_STATUS_PARTIALLY_PAID = "PARTIALLY_PAID";
    public static final String INVOICE_STATUS_PAID = "PAID";
    public static final String INVOICE_STATUS_CANCELLED = "CANCELLED";
    public static final String INVOICE_STATUS_REJECTED = "REJECTED";

    // ============================================================
    // PAYMENT STATUS CONSTANTS
    // ============================================================

    public static final String PAYMENT_STATUS_UNPAID = "UNPAID";
    public static final String PAYMENT_STATUS_PARTIAL = "PARTIAL";
    public static final String PAYMENT_STATUS_FULL = "FULL";

    // ============================================================
    // GL POSTING STATUS CONSTANTS
    // ============================================================

    public static final String GL_POSTING_STATUS_PENDING = "PENDING";
    public static final String GL_POSTING_STATUS_POSTED = "POSTED";
    public static final String GL_POSTING_STATUS_FAILED = "FAILED";

    // ============================================================
    // TAX CONSTANTS
    // ============================================================

    public static final String TAX_TYPE_CGST = "CGST";
    public static final String TAX_TYPE_SGST = "SGST";
    public static final String TAX_TYPE_IGST = "IGST";
    public static final String TAX_TYPE_TDS = "TDS";

    // ============================================================
    // GL ACCOUNT TYPES FOR AP
    // ============================================================

    public static final String GL_ACCOUNT_TYPE_EXPENSE = "EXPENSE";
    public static final String GL_ACCOUNT_TYPE_PAYABLE = "LIABILITY";
    public static final String GL_ACCOUNT_TYPE_INPUT_GST = "ASSET";
    public static final String GL_ACCOUNT_TYPE_TDS_PAYABLE = "LIABILITY";

    // ============================================================
    // BUSINESS RULE CONSTANTS
    // ============================================================

    /** Maximum days overdue before flagging as critical */
    public static final int MAX_OVERDUE_DAYS_CRITICAL = 90;

    /** Minimum decimal scale for amount fields */
    public static final int AMOUNT_SCALE = 4;

    /** Minimum decimal scale for exchange rates */
    public static final int EXCHANGE_RATE_SCALE = 6;

    /** Default payment percentage precision */
    public static final int PAYMENT_PERCENTAGE_SCALE = 2;

    /** Maximum tax percentage allowed */
    public static final int MAX_TAX_PERCENTAGE = 100;

    /** Threshold for payment amount comparison (to handle floating point precision) */
    public static final String PAYMENT_COMPARISON_THRESHOLD = "0.01";

    // ============================================================
    // APPROVAL CONSTANTS
    // ============================================================

    public static final String APPROVAL_LEVEL_DEPARTMENT = "DEPARTMENT";
    public static final String APPROVAL_LEVEL_FINANCE = "FINANCE";
    public static final String APPROVAL_LEVEL_AUDIT = "AUDIT";

    // ============================================================
    // API ENDPOINT PATHS
    // ============================================================

    public static final String AP_INVOICE_API_BASE_PATH = "/api/ap/invoices";
    public static final String AP_INVOICE_CREATE_PATH = "";
    public static final String AP_INVOICE_UPDATE_PATH = "/{id}";
    public static final String AP_INVOICE_DELETE_PATH = "/{id}";
    public static final String AP_INVOICE_GET_BY_ID_PATH = "/{id}";
    public static final String AP_INVOICE_GET_ALL_PATH = "";
    public static final String AP_INVOICE_GET_BY_NUMBER_PATH = "/number/{invoiceNo}";
    public static final String AP_INVOICE_APPROVE_PATH = "/{id}/approve";
    public static final String AP_INVOICE_REJECT_PATH = "/{id}/reject";
    public static final String AP_INVOICE_POST_PATH = "/{id}/post";
    public static final String AP_INVOICE_CANCEL_PATH = "/{id}/cancel";
    public static final String AP_INVOICE_MARK_PAID_PATH = "/{id}/mark-paid";
    public static final String AP_INVOICE_OUTSTANDING_PATH = "/outstanding";
    public static final String AP_INVOICE_OVERDUE_PATH = "/overdue";
    public static final String AP_INVOICE_AGING_PATH = "/aging";

    // ============================================================
    // ERROR CODES
    // ============================================================

    public static final String ERROR_INVOICE_NOT_FOUND = "AP_INVOICE_NOT_FOUND";
    public static final String ERROR_DUPLICATE_INVOICE = "DUPLICATE_INVOICE_NUMBER";
    public static final String ERROR_INVALID_VENDOR = "INVALID_VENDOR";
    public static final String ERROR_INVOICE_ALREADY_POSTED = "INVOICE_ALREADY_POSTED";
    public static final String ERROR_APPROVAL_FAILED = "INVOICE_APPROVAL_FAILED";
    public static final String ERROR_PAYMENT_FAILED = "INVOICE_PAYMENT_FAILED";
    public static final String ERROR_INVALID_STATUS = "INVALID_STATUS_TRANSITION";
    public static final String ERROR_INVALID_TAX = "INVALID_TAX_CALCULATION";
    public static final String ERROR_CLOSED_PERIOD = "CLOSED_PERIOD";
    public static final String ERROR_CREDIT_LIMIT_EXCEEDED = "CREDIT_LIMIT_EXCEEDED";

    // ============================================================
    // AGING BUCKET DEFINITIONS (Days)
    // ============================================================

    public static final int AGING_BUCKET_0_30 = 30;
    public static final int AGING_BUCKET_31_60 = 60;
    public static final int AGING_BUCKET_61_90 = 90;
    public static final int AGING_BUCKET_90_PLUS = Integer.MAX_VALUE;

    public static final String AGING_BUCKET_NAME_0_30 = "0-30 Days";
    public static final String AGING_BUCKET_NAME_31_60 = "31-60 Days";
    public static final String AGING_BUCKET_NAME_61_90 = "61-90 Days";
    public static final String AGING_BUCKET_NAME_90_PLUS = "90+ Days";

    // ============================================================
    // CURRENCY DEFAULTS
    // ============================================================

    public static final String DEFAULT_CURRENCY_CODE = "INR";
    public static final String DEFAULT_EXCHANGE_RATE = "1.0";

    // ============================================================
    // LOGGING MESSAGES
    // ============================================================

    public static final String LOG_INVOICE_CREATED = "AP Invoice created: {} for vendor: {}";
    public static final String LOG_INVOICE_UPDATED = "AP Invoice updated: {} by user: {}";
    public static final String LOG_INVOICE_DELETED = "AP Invoice deleted: {} by user: {}";
    public static final String LOG_INVOICE_APPROVED = "AP Invoice approved: {} by user: {}";
    public static final String LOG_INVOICE_POSTED = "AP Invoice posted: {} to GL";
    public static final String LOG_INVOICE_PAID = "AP Invoice marked as paid: {}";
    public static final String LOG_INVOICE_CANCELLED = "AP Invoice cancelled: {}";
    public static final String LOG_GL_POSTING_CREATED = "GL posting created for invoice: {} with entry: {}";

    // ============================================================
    // RESPONSE MESSAGE KEYS
    // ============================================================

    public static final String MSG_INVOICE_CREATED_SUCCESS = "AP invoice created successfully";
    public static final String MSG_INVOICE_UPDATED_SUCCESS = "AP invoice updated successfully";
    public static final String MSG_INVOICE_DELETED_SUCCESS = "AP invoice deleted successfully";
    public static final String MSG_INVOICE_APPROVED_SUCCESS = "AP invoice approved successfully";
    public static final String MSG_INVOICE_REJECTED_SUCCESS = "AP invoice rejected successfully";
    public static final String MSG_INVOICE_POSTED_SUCCESS = "AP invoice posted to GL successfully";
    public static final String MSG_INVOICE_CANCELLED_SUCCESS = "AP invoice cancelled successfully";
    public static final String MSG_INVOICE_PAID_SUCCESS = "AP invoice marked as paid successfully";
}
