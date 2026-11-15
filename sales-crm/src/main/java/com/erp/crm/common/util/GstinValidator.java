package com.erp.crm.common.util;

import java.util.regex.Pattern;

public final class GstinValidator {

    private static final Pattern GSTIN_PATTERN = 
            Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");

    private static final Pattern PAN_PATTERN = 
            Pattern.compile("^[A-Z]{5}[0-9]{4}[A-Z]{1}$");

    private GstinValidator() {
        throw new AssertionError("Cannot instantiate GstinValidator");
    }

    public static boolean isValidGstin(String gstin) {
        if (gstin == null || gstin.isBlank()) {
            return false;
        }
        return GSTIN_PATTERN.matcher(gstin.trim().toUpperCase()).matches();
    }

    public static boolean isValidPan(String pan) {
        if (pan == null || pan.isBlank()) {
            return false;
        }
        return PAN_PATTERN.matcher(pan.trim().toUpperCase()).matches();
    }

    public static String extractPanFromGstin(String gstin) {
        if (isValidGstin(gstin)) {
            return gstin.trim().toUpperCase().substring(2, 12);
        }
        return null;
    }

    public static String extractStateCodeFromGstin(String gstin) {
        if (isValidGstin(gstin)) {
            return gstin.trim().substring(0, 2);
        }
        return null;
    }
}

