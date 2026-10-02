package com.erp.account.util;

import com.erp.account.common.exception.BadRequestException;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Utility class for currency-related validations
 * 
 * Validates:
 * - Currency codes
 * - Exchange rates
 * - Multi-currency conversions
 */
@Slf4j
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public class CurrencyValidationUtil {

    private static final Set<String> SUPPORTED_CURRENCIES = new HashSet<>(Arrays.asList(
        "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "NZD",
        "INR", "SGD", "HKD", "AED", "SAR", "QAR",
        "MYR", "PHP", "IDR", "THB", "VND", "PKR", "BDT", "LKR"
    ));

    private static final int CURRENCY_CODE_LENGTH = 3;
    private static final BigDecimal MIN_EXCHANGE_RATE = new BigDecimal("0.000001");
    private static final BigDecimal MAX_EXCHANGE_RATE = new BigDecimal("999999.999999");

    // ============================================================
    // CURRENCY CODE VALIDATION
    // ============================================================

    /**
     * Validate currency code format (3-letter alphanumeric)
     *
     * @param currencyCode Currency code to validate
     * @return true if valid format, false otherwise
     */
    public static boolean isValidCurrencyFormat(String currencyCode) {
        if (currencyCode == null || currencyCode.isBlank()) {
            return false;
        }

        if (currencyCode.length() != CURRENCY_CODE_LENGTH) {
            return false;
        }

        return currencyCode.toUpperCase().matches("^[A-Z]{3}$");
    }

    /**
     * Validate if currency code is in supported list
     *
     * @param currencyCode Currency code to validate
     * @return true if supported, false otherwise
     */
    public static boolean isSupportedCurrency(String currencyCode) {
        if (currencyCode == null) {
            return false;
        }

        return SUPPORTED_CURRENCIES.contains(currencyCode.toUpperCase());
    }

    /**
     * Validate currency code - throws exception if invalid
     *
     * @param currencyCode Currency code to validate
     * @throws BadRequestException if invalid
     */
    public static void validateCurrencyCode(String currencyCode) {
        if (currencyCode != null && !currencyCode.isBlank()) {
            if (!isValidCurrencyFormat(currencyCode)) {
                throw new BadRequestException(
                    "Invalid currency code format. Must be 3-letter code (e.g., USD, EUR, INR)",
                    "INVALID_CURRENCY_CODE"
                );
            }

            if (!isSupportedCurrency(currencyCode)) {
                throw new BadRequestException(
                    "Currency '" + currencyCode + "' is not supported",
                    "UNSUPPORTED_CURRENCY"
                );
            }
        }
    }

    // ============================================================
    // EXCHANGE RATE VALIDATION
    // ============================================================

    /**
     * Validate exchange rate value
     * Exchange rates must be positive and within reasonable bounds
     *
     * @param exchangeRate Exchange rate to validate
     * @throws BadRequestException if invalid
     */
    public static void validateExchangeRate(BigDecimal exchangeRate) {
        if (exchangeRate == null) {
            throw new BadRequestException("Exchange rate cannot be null", "MISSING_EXCHANGE_RATE");
        }

        if (exchangeRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(
                "Exchange rate must be greater than 0",
                "INVALID_EXCHANGE_RATE"
            );
        }

        if (exchangeRate.compareTo(MIN_EXCHANGE_RATE) < 0) {
            throw new BadRequestException(
                "Exchange rate is too small. Minimum: " + MIN_EXCHANGE_RATE,
                "EXCHANGE_RATE_TOO_SMALL"
            );
        }

        if (exchangeRate.compareTo(MAX_EXCHANGE_RATE) > 0) {
            throw new BadRequestException(
                "Exchange rate is too large. Maximum: " + MAX_EXCHANGE_RATE,
                "EXCHANGE_RATE_TOO_LARGE"
            );
        }
    }

    /**
     * Validate exchange rate for multi-currency transaction
     * Exchange rate is mandatory if currencies are different
     *
     * @param invoiceCurrency Invoice currency
     * @param baseCurrency Base currency
     * @param exchangeRate Exchange rate
     * @throws BadRequestException if validation fails
     */
    public static void validateExchangeRateForMultiCurrency(String invoiceCurrency, String baseCurrency,
                                                            BigDecimal exchangeRate) {
        // If no invoice currency, it defaults to base currency (no exchange rate needed)
        if (invoiceCurrency == null || invoiceCurrency.isBlank()) {
            return;
        }

        // If currencies are the same
        if (invoiceCurrency.equalsIgnoreCase(baseCurrency)) {
            log.debug("Same currency used for invoice and base, exchange rate not required");
            return;
        }

        // Different currencies - exchange rate is mandatory
        if (exchangeRate == null) {
            throw new BadRequestException(
                "Exchange rate is mandatory for multi-currency transaction (Invoice: " + invoiceCurrency +
                ", Base: " + baseCurrency + ")",
                "MISSING_EXCHANGE_RATE"
            );
        }

        validateExchangeRate(exchangeRate);
    }

    // ============================================================
    // MULTI-CURRENCY CONVERSION VALIDATION
    // ============================================================

    /**
     * Validate multi-currency conversion is possible
     *
     * @param invoiceAmount Amount in invoice currency
     * @param exchangeRate Exchange rate to apply
     * @return true if valid, false otherwise
     */
    public static boolean isValidMultiCurrencyConversion(BigDecimal invoiceAmount, BigDecimal exchangeRate) {
        if (invoiceAmount == null || exchangeRate == null) {
            return false;
        }

        if (invoiceAmount.compareTo(BigDecimal.ZERO) < 0) {
            return false;
        }

        if (exchangeRate.compareTo(BigDecimal.ZERO) <= 0) {
            return false;
        }

        return true;
    }

    // ============================================================
    // SUPPORTED CURRENCIES
    // ============================================================

    /**
     * Get list of all supported currencies
     *
     * @return Set of supported currency codes
     */
    public static Set<String> getSupportedCurrencies() {
        return new HashSet<>(SUPPORTED_CURRENCIES);
    }

    /**
     * Check if currency is base currency (INR by default)
     *
     * @param currencyCode Currency code to check
     * @param baseCurrency Base currency for the company
     * @return true if currency equals base currency
     */
    public static boolean isBaseCurrency(String currencyCode, String baseCurrency) {
        if (currencyCode == null || baseCurrency == null) {
            return false;
        }

        return currencyCode.equalsIgnoreCase(baseCurrency);
    }
}
