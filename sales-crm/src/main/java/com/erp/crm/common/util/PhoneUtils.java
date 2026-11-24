package com.erp.crm.common.util;

import java.util.regex.Pattern;

public final class PhoneUtils {

    private static final Pattern NON_DIGITS = Pattern.compile("[^0-9+]");

    private PhoneUtils() {
        throw new AssertionError("Cannot instantiate PhoneUtils");
    }

    /**
     * Normalizes a phone number to standard E.164 format.
     * Defaults to Indian country code (+91) if 10 digits provided.
     * Returns null if phone has no digits or cannot be normalized.
     */
    public static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }

        // Must contain at least one digit
        if (!phone.chars().anyMatch(Character::isDigit)) {
            return null;
        }

        String cleaned = NON_DIGITS.matcher(phone.trim()).replaceAll("");
        // Remove duplicate '+' if any
        if (cleaned.startsWith("+")) {
            String digits = cleaned.substring(1).replace("+", "");
            if (digits.isBlank()) {
                return null;
            }
            cleaned = "+" + digits;
        } else {
            cleaned = cleaned.replace("+", "");
            if (cleaned.isBlank()) {
                return null;
            }
        }

        String result;
        if (cleaned.startsWith("+")) {
            result = cleaned;
        } else if (cleaned.startsWith("0") && cleaned.length() == 11) {
            result = "+91" + cleaned.substring(1);
        } else if (cleaned.length() == 10) {
            result = "+91" + cleaned;
        } else if (cleaned.startsWith("91") && cleaned.length() == 12) {
            result = "+" + cleaned;
        } else {
            result = "+" + cleaned;
        }

        // Bound to max column length (normalized_phone is max 20, standard E.164 is max 16)
        if (result.length() > 20) {
            result = result.substring(0, 20);
        }
        return result;
    }
}
