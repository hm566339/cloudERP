package com.erp.account.util;

import com.erp.account.modules.apinvoice.dto.request.ApInvoiceRequest;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import com.erp.account.modules.auth.dto.ssoresponse.Status;
import com.erp.account.common.exception.BadRequestException;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import java.util.regex.Pattern;
import com.erp.account.common.exception.ForbiddenException;
import com.erp.account.modules.company.entity.Company;


/**
 * Utility class for AP Invoice validations
 * 
 * Validates:
 * - Date validations
 * - Amount validations
 * - Invoice number format
 * - Currency and exchange rate
 * - Status transitions
 */
@Slf4j
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class InvoiceValidationUtil {

    private static final Pattern INVOICE_NO_PATTERN = Pattern.compile("^[A-Z0-9/-]+$");
    private static final Pattern CURRENCY_CODE_PATTERN = Pattern.compile("^[A-Z]{3}$");

    // ============================================================
    // DATE VALIDATIONS
    // ============================================================

    /**
     * Validate invoice date is not in future
     *
     * @param invoiceDate Invoice date to validate
     * @throws BadRequestException if date is in future
     */
    public static void validateInvoiceDate(LocalDate invoiceDate) {
        if (invoiceDate == null) {
            throw new BadRequestException("Invoice date cannot be null", "INVALID_INVOICE_DATE");
        }

        if (invoiceDate.isAfter(LocalDate.now())) {
            throw new BadRequestException("Invoice date cannot be in the future", "FUTURE_INVOICE_DATE");
        }
    }

    /**
     * Validate due date is >= invoice date
     *
     * @param invoiceDate Invoice date
     * @param dueDate Due date
     * @throws BadRequestException if due date is before invoice date
     */
    public static void validateDueDateAfterInvoiceDate(LocalDate invoiceDate, LocalDate dueDate) {
        if (invoiceDate == null || dueDate == null) {
            throw new BadRequestException("Invoice and due dates cannot be null", "INVALID_DATES");
        }

        if (dueDate.isBefore(invoiceDate)) {
            throw new BadRequestException("Due date must be on or after invoice date", "INVALID_DUE_DATE");
        }
    }

    // ============================================================
    // AMOUNT VALIDATIONS
    // ============================================================

    /**
     * Validate subtotal is non-negative
     *
     * @param subtotal Subtotal to validate
     * @throws BadRequestException if subtotal is negative
     */
    public static void validateSubtotal(BigDecimal subtotal) {
        if (subtotal == null) {
            throw new BadRequestException("Subtotal cannot be null", "INVALID_SUBTOTAL");
        }

        if (subtotal.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Subtotal cannot be negative", "NEGATIVE_SUBTOTAL");
        }
    }

    /**
     * Validate tax amount is non-negative
     *
     * @param taxAmount Tax amount to validate
     * @throws BadRequestException if tax is negative
     */
    public static void validateTaxAmount(BigDecimal taxAmount) {
        if (taxAmount == null) {
            throw new BadRequestException("Tax amount cannot be null", "INVALID_TAX_AMOUNT");
        }

        if (taxAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Tax amount cannot be negative", "NEGATIVE_TAX_AMOUNT");
        }
    }

    /**
     * Validate TDS amount is non-negative
     *
     * @param tdsAmount TDS amount to validate
     * @throws BadRequestException if TDS is negative
     */
    public static void validateTdsAmount(BigDecimal tdsAmount) {
        if (tdsAmount == null) {
            return; // TDS is optional
        }

        if (tdsAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("TDS amount cannot be negative", "NEGATIVE_TDS_AMOUNT");
        }
    }

    /**
     * Validate total amount matches calculated value
     * total should equal: subtotal + tax - tds
     *
     * @param subtotal Subtotal
     * @param taxAmount Tax
     * @param tdsAmount TDS
     * @param freightCharges Freight
     * @param totalAmount Reported total
     * @throws BadRequestException if calculation doesn't match
     */
    public static void validateTotalAmount(BigDecimal subtotal, BigDecimal taxAmount, 
                                          BigDecimal tdsAmount, BigDecimal freightCharges, BigDecimal totalAmount) {
        if (totalAmount == null) {
            throw new BadRequestException("Total amount cannot be null", "INVALID_TOTAL_AMOUNT");
        }

        BigDecimal calculatedTotal = InvoiceCalculationHelper.calculateTotalAmount(subtotal, taxAmount, tdsAmount, freightCharges);

        if (!InvoiceCalculationHelper.areAmountsEqual(totalAmount, calculatedTotal)) {
            throw new BadRequestException(
                "Total amount mismatch. Expected: " + calculatedTotal + ", Got: " + totalAmount,
                "TOTAL_AMOUNT_MISMATCH"
            );
        }
    }

    /**
     * Validate paid amount does not exceed total amount
     *
     * @param paidAmount Amount paid
     * @param totalAmount Total amount
     * @throws BadRequestException if paid exceeds total
     */
    public static void validatePaidAmount(BigDecimal paidAmount, BigDecimal totalAmount) {
        if (paidAmount == null) {
            return; // Paid amount defaults to 0
        }

        if (paidAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Paid amount cannot be negative", "NEGATIVE_PAID_AMOUNT");
        }

        if (paidAmount.compareTo(totalAmount) > 0) {
            throw new BadRequestException("Paid amount cannot exceed total amount", "PAID_EXCEEDS_TOTAL");
        }
    }

    /**
     * Validate quantity is positive
     *
     * @param quantity Quantity to validate
     * @throws BadRequestException if quantity is invalid
     */
    public static void validateQuantity(BigDecimal quantity) {
        if (quantity == null) {
            throw new BadRequestException("Quantity cannot be null", "INVALID_QUANTITY");
        }

        if (quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Quantity must be greater than 0", "INVALID_QUANTITY");
        }
    }

    /**
     * Validate unit price is non-negative
     *
     * @param unitPrice Unit price to validate
     * @throws BadRequestException if price is negative
     */
    public static void validateUnitPrice(BigDecimal unitPrice) {
        if (unitPrice == null) {
            throw new BadRequestException("Unit price cannot be null", "INVALID_UNIT_PRICE");
        }

        if (unitPrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Unit price cannot be negative", "NEGATIVE_UNIT_PRICE");
        }
    }

    // ============================================================
    // INVOICE NUMBER VALIDATIONS
    // ============================================================

    /**
     * Validate invoice number format
     * Allows alphanumeric, hyphens, and slashes
     *
     * @param invoiceNo Invoice number to validate
     * @throws BadRequestException if format is invalid
     */
    public static void validateInvoiceNumberFormat(String invoiceNo) {
        if (invoiceNo == null || invoiceNo.isBlank()) {
            throw new BadRequestException("Invoice number cannot be empty", "EMPTY_INVOICE_NO");
        }

        if (!INVOICE_NO_PATTERN.matcher(invoiceNo).matches()) {
            throw new BadRequestException(
                "Invalid invoice number format. Only alphanumeric, hyphen, and slash allowed",
                "INVALID_INVOICE_NO_FORMAT"
            );
        }
    }

    // ============================================================
    // CURRENCY VALIDATIONS
    // ============================================================

    /**
     * Validate currency code format
     *
     * @param currencyCode Currency code to validate
     * @throws BadRequestException if format is invalid
     */
    public static void validateCurrencyCode(String currencyCode) {
        if (currencyCode != null && !currencyCode.isBlank()) {
            if (!CURRENCY_CODE_PATTERN.matcher(currencyCode).matches()) {
                throw new BadRequestException(
                    "Invalid currency code format. Must be 3-letter code (e.g., USD, EUR, INR)",
                    "INVALID_CURRENCY_CODE"
                );
            }
        }
    }

    /**
     * Validate exchange rate
     *
     * @param exchangeRate Exchange rate to validate
     * @throws BadRequestException if invalid
     */
    public static void validateExchangeRate(BigDecimal exchangeRate) {
        if (exchangeRate != null && exchangeRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Exchange rate must be greater than 0", "INVALID_EXCHANGE_RATE");
        }
    }

    /**
     * Validate exchange rate is provided for multi-currency invoices
     *
     * @param invoiceCurrency Invoice currency
     * @param baseCurrency Base currency
     * @param exchangeRate Exchange rate
     * @throws BadRequestException if exchange rate missing for different currencies
     */
    public static void validateExchangeRateForMultiCurrency(String invoiceCurrency, String baseCurrency, 
                                                            BigDecimal exchangeRate) {
        if (invoiceCurrency != null && !invoiceCurrency.equalsIgnoreCase(baseCurrency)) {
            if (exchangeRate == null || exchangeRate.compareTo(BigDecimal.ZERO) == 0) {
                throw new BadRequestException(
                    "Exchange rate is mandatory for multi-currency invoices",
                    "MISSING_EXCHANGE_RATE"
                );
            }
        }
    }

    // ============================================================
    // COLLECTION VALIDATIONS
    // ============================================================

    /**
     * Validate invoice has at least one line item
     *
     * @param itemCount Number of line items
     * @throws BadRequestException if no items present
     */
    public static void validateLineItems(int itemCount) {
        if (itemCount == 0) {
            throw new BadRequestException("Invoice must have at least one line item", "NO_LINE_ITEMS");
        }
    }

    // ============================================================
    // STATUS VALIDATIONS
    // ============================================================

    /**
     * Validate that the invoice belongs to the requesting company
     *
     * @param invoiceCompanyId Company id on the invoice
     * @param requestingCompanyId Company id of the user/request
     */
    public static void validateCompanyAccess(UUID invoiceCompanyId, UUID requestingCompanyId) {
        if (invoiceCompanyId == null || requestingCompanyId == null) {
            throw new ForbiddenException("Company access information missing");
        }

        if (!invoiceCompanyId.equals(requestingCompanyId)) {
            throw new ForbiddenException("Access denied for the requested company resource");
        }
    }

    /** Convenience overload that accepts string UUIDs and delegates to UUID version */
    public static void validateCompanyAccess(String invoiceCompanyIdStr, String requestingCompanyIdStr) {
        if (invoiceCompanyIdStr == null || requestingCompanyIdStr == null) {
            throw new ForbiddenException("Company access information missing");
        }
        try {
            UUID invoiceCompanyId = UUID.fromString(invoiceCompanyIdStr);
            UUID requestingCompanyId = UUID.fromString(requestingCompanyIdStr);
            validateCompanyAccess(invoiceCompanyId, requestingCompanyId);
        } catch (IllegalArgumentException ex) {
            throw new ForbiddenException("Invalid company id format");
        }
    }

    /**
     * Validate invoice can be edited
     * Only DRAFT and PENDING_APPROVAL invoices can be edited
     *
     * @param invoiceStatus Current status
     * @throws BadRequestException if invoice cannot be edited
     */
    public static void validateInvoiceEditable(String invoiceStatus) {
        if ("POSTED".equals(invoiceStatus) || "PAID".equals(invoiceStatus) || "CANCELLED".equals(invoiceStatus)) {
            throw new BadRequestException(
                "Invoice with status " + invoiceStatus + " cannot be edited",
                "INVOICE_NOT_EDITABLE"
            );
        }
    }

    /**
     * Validate invoice can be deleted
     * Only DRAFT invoices can be deleted
     *
     * @param invoiceStatus Current status
     * @throws BadRequestException if invoice cannot be deleted
     */
    public static void validateInvoiceDeletable(String invoiceStatus) {
        if (!"DRAFT".equals(invoiceStatus)) {
            throw new BadRequestException(
                "Only DRAFT invoices can be deleted",
                "INVOICE_NOT_DELETABLE"
            );
        }
    }
}
