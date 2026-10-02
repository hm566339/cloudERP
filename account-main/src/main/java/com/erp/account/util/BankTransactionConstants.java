package com.erp.account.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Bank Transaction Constants
 * 
 * Contains all constant values used in bank transaction operations.
 * 
 * @author ERP System
 * @version 1.0
 */
public final class BankTransactionConstants {

    private BankTransactionConstants() {
        throw new UnsupportedOperationException("Constants class cannot be instantiated");
    }

    // ==================== VALIDATION MESSAGES ====================

    public static final String INVALID_BANK_ACCOUNT = "Bank account not found or is inactive";
    public static final String INVALID_DEBIT_CREDIT = "Either debit or credit must be provided, not both";
    public static final String INVALID_AMOUNT_ZERO = "Both debit and credit amounts cannot be zero";
    public static final String INVALID_AMOUNT_NEGATIVE = "Amounts cannot be negative";
    public static final String INVALID_TRANSACTION_DATE = "Transaction date cannot be in the future";
    public static final String DUPLICATE_REFERENCE = "Duplicate reference number in same company";
    public static final String DUPLICATE_UTR = "Duplicate UTR number in same company";
    public static final String RECONCILED_TRANSACTION = "Reconciled transactions cannot be modified";
    public static final String CLOSED_PERIOD = "Accounting period is closed for this date";
    public static final String CLOSED_FISCAL_YEAR = "Fiscal year is closed for this date";
    public static final String CROSS_COMPANY_ACCESS = "Cross-company transaction access is not allowed";

    // ==================== TRANSACTION TYPE MESSAGES ====================

    public static final String TRANSACTION_TYPE_DEPOSIT = "Deposit";
    public static final String TRANSACTION_TYPE_WITHDRAWAL = "Withdrawal";
    public static final String TRANSACTION_TYPE_PAYMENT = "Payment";
    public static final String TRANSACTION_TYPE_RECEIPT = "Receipt";
    public static final String TRANSACTION_TYPE_BANK_CHARGES = "Bank Charges";
    public static final String TRANSACTION_TYPE_INTEREST = "Interest";
    public static final String TRANSACTION_TYPE_TRANSFER = "Transfer";
    public static final String TRANSACTION_TYPE_REVERSAL = "Reversal";

    // ==================== GL POSTING CONSTANTS ====================

    public static final String GL_SOURCE_MODULE = "BANK_TRANSACTION";
    public static final String GL_NARRATION_FORMAT = "Bank Transaction: %s - %s";
    public static final String GL_POSTING_ERROR = "Failed to post GL entry";

    // ==================== RECONCILIATION CONSTANTS ====================

    public static final BigDecimal RECONCILIATION_TOLERANCE = new BigDecimal("0.01");
    public static final String RECONCILIATION_MATCHED = "Matched";
    public static final String RECONCILIATION_UNMATCHED = "Unmatched";

    // ==================== NUMERIC CONSTANTS ====================

    public static final int AMOUNT_SCALE = 4;
    public static final int AMOUNT_PRECISION = 19;
    public static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    // ==================== STRING CONSTANTS ====================

    public static final String REVERSAL_SUFFIX = "_REVERSAL";
    public static final String UTR_REVERSAL_SUFFIX = "_REVERSAL";

    // ==================== FIELD LENGTHS ====================

    public static final int REFERENCE_NO_LENGTH = 100;
    public static final int UTR_NO_LENGTH = 50;
    public static final int NARRATION_LENGTH = 1000;

}
