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
     */
    public static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }

        String cleaned = NON_DIGITS.matcher(phone.trim()).replaceAll("");
        if (cleaned.startsWith("+")) {
            return cleaned;
        }

        if (cleaned.startsWith("0") && cleaned.length() == 11) {
            return "+91" + cleaned.substring(1);
        }

        if (cleaned.length() == 10) {
            return "+91" + cleaned;
        }

        if (cleaned.startsWith("91") && cleaned.length() == 12) {
            return "+" + cleaned;
        }

        return "+" + cleaned;
    }
}

