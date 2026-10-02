package com.erp.account.util;

import com.erp.account.common.exception.InvalidTaxCalculationException;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;

/**
 * Utility class for GST and tax calculations
 * 
 * Handles:
 * - GST validation (CGST, SGST, IGST)
 * - Tax rate validation
 * - Tax breakdown calculations
 * - GSTIN format validation
 */
@Slf4j
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class TaxCalculationHelper {

    private static final BigDecimal GST_5_PERCENT = new BigDecimal("5");
    private static final BigDecimal GST_12_PERCENT = new BigDecimal("12");
    private static final BigDecimal GST_18_PERCENT = new BigDecimal("18");
    private static final BigDecimal GST_28_PERCENT = new BigDecimal("28");

    private static final BigDecimal MAX_TAX_RATE = new BigDecimal("100");

    // ============================================================
    // GSTIN VALIDATION
    // ============================================================

    /**
     * Validate GSTIN format
     * GSTIN format: 15 alphanumeric characters
     * Pattern: [0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}
     *
     * @param gstin GSTIN to validate
     * @return true if valid format, false otherwise
     */
    public static boolean isValidGSTIN(String gstin) {
        if (gstin == null || gstin.isBlank()) {
            return false;
        }

        // Check length
        if (gstin.length() != 15) {
            return false;
        }

        // Basic format check
        return gstin.matches("\\d{2}[A-Z]{5}\\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}");
    }

    // ============================================================
    // TAX RATE VALIDATION
    // ============================================================

    /**
     * Validate if tax rate is within acceptable range (0-100)
     *
     * @param taxRate Tax rate to validate
     * @throws InvalidTaxCalculationException if rate is invalid
     */
    public static void validateTaxRate(BigDecimal taxRate) {
        if (taxRate == null) {
            throw new InvalidTaxCalculationException("Tax rate cannot be null", "INVALID_TAX_RATE");
        }

        if (taxRate.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidTaxCalculationException("Tax rate cannot be negative", "NEGATIVE_TAX_RATE");
        }

        if (taxRate.compareTo(MAX_TAX_RATE) > 0) {
            throw new InvalidTaxCalculationException("Tax rate cannot exceed 100%", "TAX_RATE_EXCEEDS_MAX");
        }
    }

    /**
     * Validate if tax rate is a standard GST rate
     *
     * @param gstRate GST rate to validate
     * @return true if standard GST rate, false otherwise
     */
    public static boolean isStandardGSTRate(BigDecimal gstRate) {
        if (gstRate == null) {
            return false;
        }

        return gstRate.compareTo(GST_5_PERCENT) == 0 ||
               gstRate.compareTo(GST_12_PERCENT) == 0 ||
               gstRate.compareTo(GST_18_PERCENT) == 0 ||
               gstRate.compareTo(GST_28_PERCENT) == 0;
    }

    // ============================================================
    // GST TYPE VALIDATION
    // ============================================================

    /**
     * Determine if IGST should be applied (Inter-state transaction)
     *
     * @param supplierState Supplier state (vendor state)
     * @param consigneeState Consignee state (place of supply)
     * @return true if different states (IGST applicable)
     */
    public static boolean isIGSTApplicable(String supplierState, String consigneeState) {
        if (supplierState == null || consigneeState == null) {
            return false;
        }

        return !supplierState.equalsIgnoreCase(consigneeState);
    }

    /**
     * Determine if CGST/SGST should be applied (Intra-state transaction)
     *
     * @param supplierState Supplier state
     * @param consigneeState Consignee state
     * @return true if same state (CGST/SGST applicable)
     */
    public static boolean isCGST_SGSTApplicable(String supplierState, String consigneeState) {
        return !isIGSTApplicable(supplierState, consigneeState);
    }

    // ============================================================
    // TAX VALIDATION
    // ============================================================

    /**
     * Validate that tax breakdown components are not negative
     *
     * @param cgst CGST amount
     * @param sgst SGST amount
     * @param igst IGST amount
     * @throws InvalidTaxCalculationException if any component is negative
     */
    public static void validateTaxComponents(BigDecimal cgst, BigDecimal sgst, BigDecimal igst) {
        if (cgst != null && cgst.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidTaxCalculationException("CGST amount cannot be negative", "NEGATIVE_CGST");
        }

        if (sgst != null && sgst.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidTaxCalculationException("SGST amount cannot be negative", "NEGATIVE_SGST");
        }

        if (igst != null && igst.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidTaxCalculationException("IGST amount cannot be negative", "NEGATIVE_IGST");
        }
    }

    /**
     * Validate that either CGST/SGST OR IGST is present, not both
     *
     * @param cgst CGST amount
     * @param sgst SGST amount
     * @param igst IGST amount
     * @throws InvalidTaxCalculationException if invalid combination
     */
    public static void validateTaxApplicability(BigDecimal cgst, BigDecimal sgst, BigDecimal igst) {
        BigDecimal zero = BigDecimal.ZERO;

        boolean hasCGSTSGST = (cgst != null && cgst.compareTo(zero) > 0) ||
                             (sgst != null && sgst.compareTo(zero) > 0);
        boolean hasIGST = igst != null && igst.compareTo(zero) > 0;

        if (hasCGSTSGST && hasIGST) {
            throw new InvalidTaxCalculationException(
                "Cannot have both CGST/SGST and IGST. Use either CGST+SGST (intra-state) or IGST (inter-state)",
                "INVALID_TAX_COMBINATION"
            );
        }
    }

    /**
     * Validate total tax matches sum of components
     *
     * @param reportedTax Total tax reported
     * @param cgst CGST amount
     * @param sgst SGST amount
     * @param igst IGST amount
     * @throws InvalidTaxCalculationException if totals don't match
     */
    public static void validateTaxTotal(BigDecimal reportedTax, BigDecimal cgst, BigDecimal sgst, BigDecimal igst) {
        BigDecimal calculatedTax = BigDecimal.ZERO;

        if (cgst != null) {
            calculatedTax = calculatedTax.add(cgst);
        }
        if (sgst != null) {
            calculatedTax = calculatedTax.add(sgst);
        }
        if (igst != null) {
            calculatedTax = calculatedTax.add(igst);
        }

        if (!InvoiceCalculationHelper.areAmountsEqual(reportedTax, calculatedTax)) {
            throw new InvalidTaxCalculationException(
                "Tax breakdown doesn't match total tax. Expected: " + calculatedTax + ", Got: " + reportedTax,
                "TAX_TOTAL_MISMATCH"
            );
        }
    }

    // ============================================================
    // STANDARD TAX SLABS
    // ============================================================

    /**
     * Get GST rate for item category
     *
     * @param itemCategory Item category code
     * @return GST rate for category
     */
    public static BigDecimal getGSTRateForCategory(String itemCategory) {
        if (itemCategory == null) {
            return GST_18_PERCENT; // Default to 18%
        }

        return switch (itemCategory.toUpperCase()) {
            case "ESSENTIAL_GOODS" -> GST_5_PERCENT;
            case "BASIC_ITEMS" -> GST_5_PERCENT;
            case "GENERAL_GOODS" -> GST_12_PERCENT;
            case "PREMIUM_GOODS" -> GST_18_PERCENT;
            case "LUXURY_GOODS" -> GST_28_PERCENT;
            default -> GST_18_PERCENT;
        };
    }
}
