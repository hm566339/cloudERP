package com.erp.account.util;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Utility class for invoice financial calculations
 * 
 * Provides:
 * - Amount calculations with proper precision
 * - Tax amount validation
 * - Payment tracking calculations
 * - Outstanding balance calculations
 * - Multi-currency conversions
 * 
 * All calculations use BigDecimal with HALF_UP rounding
 */
@Slf4j
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class InvoiceCalculationHelper {

    private static final int AMOUNT_SCALE = 4;
    private static final int EXCHANGE_RATE_SCALE = 6;
    private static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    // ============================================================
    // BASIC CALCULATIONS
    // ============================================================

    /**
     * Calculate total amount from subtotal, tax, tds, freight, and other charges
     * Formula: total = subtotal + tax - tds + freight + otherCharges
     *
     * @param subtotal Subtotal amount
     * @param taxAmount Tax amount
     * @param tdsAmount TDS amount
     * @param freightCharges Freight charges
     * @param otherCharges Other charges
     * @return Total amount
     */
    public static BigDecimal calculateTotalAmount(BigDecimal subtotal, BigDecimal taxAmount, BigDecimal tdsAmount, BigDecimal freightCharges, BigDecimal otherCharges) {
        if (subtotal == null) {
            subtotal = BigDecimal.ZERO;
        }
        if (taxAmount == null) {
            taxAmount = BigDecimal.ZERO;
        }
        if (tdsAmount == null) {
            tdsAmount = BigDecimal.ZERO;
        }
        if (freightCharges == null) {
            freightCharges = BigDecimal.ZERO;
        }
        if (otherCharges == null) {
            otherCharges = BigDecimal.ZERO;
        }

        return subtotal
            .add(taxAmount)
            .subtract(tdsAmount)
            .add(freightCharges)
            .add(otherCharges)
            .setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    /**
     * Calculate total amount from subtotal, tax, tds, and freight
     * Formula: total = subtotal + tax - tds + freight
     *
     * @param subtotal Subtotal amount
     * @param taxAmount Tax amount
     * @param tdsAmount TDS amount
     * @param freightCharges Freight charges
     * @return Total amount
     */
    public static BigDecimal calculateTotalAmount(BigDecimal subtotal, BigDecimal taxAmount, BigDecimal tdsAmount, BigDecimal freightCharges) {
        return calculateTotalAmount(subtotal, taxAmount, tdsAmount, freightCharges, BigDecimal.ZERO);
    }

    /**
     * Calculate round off amount
     * Formula: roundOff = roundedTotal - totalBeforeRoundOff
     *
     * @param totalBeforeRoundOff Total amount before round off
     * @return Round off amount
     */
    public static BigDecimal calculateRoundOff(BigDecimal totalBeforeRoundOff) {
        if (totalBeforeRoundOff == null) {
            return BigDecimal.ZERO;
        }
        
        // Round to nearest integer (whole number)
        BigDecimal rounded = totalBeforeRoundOff.setScale(0, ROUNDING_MODE);
        
        // Return difference: rounded - original
        return rounded.subtract(totalBeforeRoundOff).setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    /**
     * Calculate outstanding amount
     * Formula: outstanding = total - paid
     *
     * @param totalAmount Total invoice amount
     * @param paidAmount Amount paid so far
     * @return Outstanding balance
     */
    public static BigDecimal calculateOutstandingAmount(BigDecimal totalAmount, BigDecimal paidAmount) {
        if (totalAmount == null || paidAmount == null) {
            log.warn("Null values provided for outstanding amount calculation");
            return BigDecimal.ZERO;
        }

        BigDecimal outstanding = totalAmount.subtract(paidAmount);
        return outstanding.setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    /**
     * Calculate payment percentage
     * Formula: percentage = (paid / total) * 100
     *
     * @param paidAmount Amount paid
     * @param totalAmount Total amount
     * @return Payment percentage (0-100)
     */
    public static BigDecimal calculatePaymentPercentage(BigDecimal paidAmount, BigDecimal totalAmount) {
        if (totalAmount == null || totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            log.warn("Invalid total amount for payment percentage calculation");
            return BigDecimal.ZERO;
        }

        if (paidAmount == null) {
            paidAmount = BigDecimal.ZERO;
        }

        return paidAmount
            .divide(totalAmount, AMOUNT_SCALE, ROUNDING_MODE)
            .multiply(new BigDecimal(100))
            .setScale(2, ROUNDING_MODE);
    }

    // ============================================================
    // TAXABLE AMOUNT CALCULATIONS
    // ============================================================

    /**
     * Calculate line item total amount
     * Formula: total = (quantity * unitPrice) + tax
     *
     * @param quantity Item quantity
     * @param unitPrice Unit price
     * @param taxAmount Tax amount
     * @return Line item total
     */
    public static BigDecimal calculateLineItemTotal(BigDecimal quantity, BigDecimal unitPrice, BigDecimal taxAmount) {
        if (quantity == null || unitPrice == null || taxAmount == null) {
            log.warn("Null values provided for line item total calculation");
            return BigDecimal.ZERO;
        }

        BigDecimal subtotal = quantity
            .multiply(unitPrice)
            .setScale(AMOUNT_SCALE, ROUNDING_MODE);

        return subtotal
            .add(taxAmount)
            .setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    /**
     * Calculate taxable amount (quantity * unitPrice)
     *
     * @param quantity Item quantity
     * @param unitPrice Unit price
     * @return Taxable amount
     */
    public static BigDecimal calculateTaxableAmount(BigDecimal quantity, BigDecimal unitPrice) {
        if (quantity == null || unitPrice == null) {
            log.warn("Null values provided for taxable amount calculation");
            return BigDecimal.ZERO;
        }

        return quantity
            .multiply(unitPrice)
            .setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    // ============================================================
    // TAX CALCULATIONS
    // ============================================================

    /**
     * Calculate CGST amount from taxable amount
     * Formula: cgst = taxable * (rate / 100)
     *
     * @param taxableAmount Taxable amount
     * @param cgstRate CGST rate
     * @return CGST amount
     */
    public static BigDecimal calculateCGST(BigDecimal taxableAmount, BigDecimal cgstRate) {
        if (taxableAmount == null || cgstRate == null) {
            log.warn("Null values provided for CGST calculation");
            return BigDecimal.ZERO;
        }

        return taxableAmount
            .multiply(cgstRate)
            .divide(new BigDecimal(100), AMOUNT_SCALE, ROUNDING_MODE)
            .setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    /**
     * Calculate SGST amount from taxable amount
     *
     * @param taxableAmount Taxable amount
     * @param sgstRate SGST rate
     * @return SGST amount
     */
    public static BigDecimal calculateSGST(BigDecimal taxableAmount, BigDecimal sgstRate) {
        if (taxableAmount == null || sgstRate == null) {
            log.warn("Null values provided for SGST calculation");
            return BigDecimal.ZERO;
        }

        return taxableAmount
            .multiply(sgstRate)
            .divide(new BigDecimal(100), AMOUNT_SCALE, ROUNDING_MODE)
            .setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    /**
     * Calculate IGST amount from taxable amount
     *
     * @param taxableAmount Taxable amount
     * @param igstRate IGST rate
     * @return IGST amount
     */
    public static BigDecimal calculateIGST(BigDecimal taxableAmount, BigDecimal igstRate) {
        if (taxableAmount == null || igstRate == null) {
            log.warn("Null values provided for IGST calculation");
            return BigDecimal.ZERO;
        }

        return taxableAmount
            .multiply(igstRate)
            .divide(new BigDecimal(100), AMOUNT_SCALE, ROUNDING_MODE)
            .setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    /**
     * Calculate TDS amount from taxable amount
     *
     * @param taxableAmount Taxable amount
     * @param tdsRate TDS rate
     * @return TDS amount
     */
    public static BigDecimal calculateTDS(BigDecimal taxableAmount, BigDecimal tdsRate) {
        if (taxableAmount == null || tdsRate == null) {
            log.warn("Null values provided for TDS calculation");
            return BigDecimal.ZERO;
        }

        return taxableAmount
            .multiply(tdsRate)
            .divide(new BigDecimal(100), AMOUNT_SCALE, ROUNDING_MODE)
            .setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    /**
     * Calculate total tax (CGST + SGST + IGST)
     *
     * @param cgstAmount CGST amount
     * @param sgstAmount SGST amount
     * @param igstAmount IGST amount
     * @return Total tax
     */
    public static BigDecimal calculateTotalTax(BigDecimal cgstAmount, BigDecimal sgstAmount, BigDecimal igstAmount) {
        BigDecimal total = BigDecimal.ZERO;

        if (cgstAmount != null) {
            total = total.add(cgstAmount);
        }
        if (sgstAmount != null) {
            total = total.add(sgstAmount);
        }
        if (igstAmount != null) {
            total = total.add(igstAmount);
        }

        return total.setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    // ============================================================
    // MULTI-CURRENCY CALCULATIONS
    // ============================================================

    /**
     * Convert amount from invoice currency to base currency
     * Formula: baseCurrency = amount * exchangeRate
     *
     * @param invoiceAmount Amount in invoice currency
     * @param exchangeRate Exchange rate
     * @return Amount in base currency
     */
    public static BigDecimal convertToBaseCurrency(BigDecimal invoiceAmount, BigDecimal exchangeRate) {
        if (invoiceAmount == null || exchangeRate == null) {
            log.warn("Null values provided for currency conversion");
            return BigDecimal.ZERO;
        }

        return invoiceAmount
            .multiply(exchangeRate)
            .setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    /**
     * Convert amount from base currency to invoice currency
     * Formula: invoiceCurrency = baseCurrencyAmount / exchangeRate
     *
     * @param baseCurrencyAmount Amount in base currency
     * @param exchangeRate Exchange rate
     * @return Amount in invoice currency
     */
    public static BigDecimal convertFromBaseCurrency(BigDecimal baseCurrencyAmount, BigDecimal exchangeRate) {
        if (baseCurrencyAmount == null || exchangeRate == null || exchangeRate.compareTo(BigDecimal.ZERO) == 0) {
            log.warn("Invalid values provided for reverse currency conversion");
            return BigDecimal.ZERO;
        }

        return baseCurrencyAmount
            .divide(exchangeRate, AMOUNT_SCALE, ROUNDING_MODE)
            .setScale(AMOUNT_SCALE, ROUNDING_MODE);
    }

    // ============================================================
    // VALIDATION CALCULATIONS
    // ============================================================

    /**
     * Validate if paid amount does not exceed total amount
     *
     * @param paidAmount Amount paid
     * @param totalAmount Total amount
     * @return true if valid, false otherwise
     */
    public static boolean isPaidAmountValid(BigDecimal paidAmount, BigDecimal totalAmount) {
        if (paidAmount == null || totalAmount == null) {
            return false;
        }
        return paidAmount.compareTo(totalAmount) <= 0;
    }

    /**
     * Validate if amounts are non-negative
     *
     * @param amount Amount to validate
     * @return true if non-negative, false otherwise
     */
    public static boolean isNonNegative(BigDecimal amount) {
        if (amount == null) {
            return false;
        }
        return amount.compareTo(BigDecimal.ZERO) >= 0;
    }

    /**
     * Validate if exchange rate is valid
     *
     * @param exchangeRate Exchange rate to validate
     * @return true if valid (positive), false otherwise
     */
    public static boolean isValidExchangeRate(BigDecimal exchangeRate) {
        if (exchangeRate == null) {
            return false;
        }
        return exchangeRate.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Check if two amounts are equal considering floating point precision
     *
     * @param amount1 First amount
     * @param amount2 Second amount
     * @return true if amounts are approximately equal
     */
    public static boolean areAmountsEqual(BigDecimal amount1, BigDecimal amount2) {
        if (amount1 == null || amount2 == null) {
            return false;
        }
        BigDecimal threshold = new BigDecimal("0.01");
        return amount1.subtract(amount2).abs().compareTo(threshold) < 0;
    }
}
