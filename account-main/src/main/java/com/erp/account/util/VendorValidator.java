package com.erp.account.util;

import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;

import com.erp.account.util.ValidationResult;
import com.erp.account.util.Vendor;

public class VendorValidator {

    private static final Pattern GSTIN_REGEX = Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$");
    private static final Pattern VENDOR_CODE_REGEX = Pattern.compile("^[A-Za-z0-9_-]+$");
    private static final Pattern EMAIL_REGEX = Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");
    private static final Pattern MOBILE_REGEX = Pattern.compile("^\\+?[0-9]{10,15}$");

    public static ValidationResult validate(Vendor vendor, List<Vendor> existingVendors) {
        ValidationResult res = new ValidationResult();
        if (vendor == null) {
            res.setStatus("Failed");
            res.addError("Vendor is null");
            return res;
        }

        // Mandatory fields
        if (isBlank(vendor.getVendorName())) res.addError("Vendor Name is mandatory");
        if (isBlank(vendor.getVendorCode())) res.addError("Vendor Code is mandatory");
        if (isBlank(vendor.getGstin())) res.addError("GSTIN is mandatory");
        if (isBlank(vendor.getAddress())) res.addError("Address is mandatory");
        if (isBlank(vendor.getEmail()) && isBlank(vendor.getMobile())) res.addError("At least one contact detail (email or mobile) is required");

        if (!res.getErrors().isEmpty()) { res.setStatus("Failed"); return res; }

        // Duplicate GSTIN
        if (existingVendors != null) {
            for (Vendor v : existingVendors) {
                if (v == null) continue;
                if (Objects.equals(normalize(v.getGstin()), normalize(vendor.getGstin())) && !Objects.equals(v.getVendorCode(), vendor.getVendorCode())) {
                    res.addError("Duplicate GSTIN detected: " + vendor.getGstin());
                    break;
                }
            }
        }

        // Duplicate Vendor Code
        if (existingVendors != null) {
            for (Vendor v : existingVendors) {
                if (v == null) continue;
                if (Objects.equals(v.getVendorCode(), vendor.getVendorCode()) && !Objects.equals(normalize(v.getGstin()), normalize(vendor.getGstin()))) {
                    res.addError("Duplicate Vendor Code detected: " + vendor.getVendorCode());
                    break;
                }
            }
        }

        // Vendor name non-empty
        if (isBlank(vendor.getVendorName())) res.addError("Vendor name must not be empty");

        // GSTIN format
        String gst = normalize(vendor.getGstin());
        if (!GSTIN_REGEX.matcher(gst).matches()) {
            res.addError("GSTIN format is invalid: " + vendor.getGstin());
        }

        // Inactive or blocked
        if (!vendor.isActive()) res.addError("Vendor is inactive: " + vendor.getVendorCode());
        if (vendor.isBlocked()) res.addError("Vendor is blocked: " + vendor.getVendorCode());

        // Vendor code validation
        if (!VENDOR_CODE_REGEX.matcher(vendor.getVendorCode()).matches()) {
            res.addError("Vendor Code contains invalid characters. Only letters, digits, underscore and hyphen allowed: " + vendor.getVendorCode());
        }

        // Email/mobile validation
        if (!isBlank(vendor.getEmail()) && !EMAIL_REGEX.matcher(vendor.getEmail()).matches()) {
            res.addError("Email format is invalid: " + vendor.getEmail());
        }
        if (!isBlank(vendor.getMobile()) && !MOBILE_REGEX.matcher(vendor.getMobile()).matches()) {
            res.addError("Mobile number format is invalid: " + vendor.getMobile());
        }

        if (res.getErrors().isEmpty()) {
            res.setStatus("Success");
            res.setMessage("Vendor validation completed successfully.");
        } else {
            res.setStatus("Failed");
        }

        return res;
    }

    private static boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
    private static String normalize(String s) { return s == null ? null : s.trim().toUpperCase(); }
}
