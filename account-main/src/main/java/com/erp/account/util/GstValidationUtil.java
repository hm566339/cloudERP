package com.erp.account.util;

import com.erp.account.common.exception.InvalidGstinException;
import com.erp.account.common.exception.InvalidPanException;
import java.util.regex.Pattern;

public final class GstValidationUtil {
    private GstValidationUtil() {}

    private static final Pattern GSTIN_PATTERN = Pattern.compile(VendorConstants.GSTIN_REGEX);
    private static final Pattern PAN_PATTERN = Pattern.compile(VendorConstants.PAN_REGEX);

    public static boolean isValidGstin(String gstin) {
        if (gstin == null || gstin.isBlank()) {
            return false;
        }
        return GSTIN_PATTERN.matcher(gstin.trim().toUpperCase()).matches();
    }

    public static void validateGstin(String gstin) throws InvalidGstinException {
        if (!isValidGstin(gstin)) {
            throw new InvalidGstinException(gstin);
        }
    }

    public static boolean isValidPan(String pan) {
        if (pan == null || pan.isBlank()) {
            return false;
        }
        return PAN_PATTERN.matcher(pan.trim().toUpperCase()).matches();
    }

    public static void validatePan(String pan) throws InvalidPanException {
        if (!isValidPan(pan)) {
            throw new InvalidPanException(pan);
        }
    }

    public static void validateGstinAndPan(String gstin, String pan) {
        if (gstin != null && !gstin.isBlank()) {
            validateGstin(gstin);
            if (pan == null || pan.isBlank()) {
                throw new InvalidPanException("PAN is mandatory when GSTIN is provided");
            }
            validatePan(pan);
        }
    }

    public static String extractPanFromGstin(String gstin) {
        if (!isValidGstin(gstin)) {
            throw new InvalidGstinException(gstin);
        }
        return gstin.substring(2, 12);
    }

    public static String getStateCodeFromGstin(String gstin) {
        if (!isValidGstin(gstin)) {
            throw new InvalidGstinException(gstin);
        }
        return gstin.substring(0, 2);
    }
}
