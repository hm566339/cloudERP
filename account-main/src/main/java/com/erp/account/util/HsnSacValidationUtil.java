package com.erp.account.util;

import com.erp.account.enums.HsnSacType;
import com.erp.account.common.exception.InvalidHsnSacFormatException;
import com.erp.account.common.exception.InvalidGstSlabException;
import com.erp.account.common.exception.InvalidTaxApplicabilityException;
import com.erp.account.modules.gstslab.entity.GstSlab;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;

import java.math.BigDecimal;
import java.util.Objects;

public final class HsnSacValidationUtil {

    private HsnSacValidationUtil() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static void validateHsnSacRequest(String code,
                                             String description,
                                             HsnSacType type,
                                             java.util.UUID gstSlabId) {
        if (code == null || code.isBlank()) {
            throw new InvalidHsnSacFormatException("HSN/SAC code is required");
        }

        if (type == null) {
            throw new InvalidHsnSacFormatException("HSN/SAC type is required");
        }

        if (!type.isValidCode(code)) {
            throw new InvalidHsnSacFormatException(
                    String.format("Code '%s' does not match required %s format", code, type.name()));
        }

        if (description == null || description.isBlank()) {
            throw new InvalidHsnSacFormatException("HSN/SAC description is required");
        }

        if (gstSlabId == null) {
            throw new InvalidGstSlabException("GST slab mapping is required");
        }
    }

    public static void validateHsnSacCreateRequest(String code,
                                                   String description,
                                                   HsnSacType type,
                                                   java.util.UUID gstSlabId) {
        if (code != null && !code.isBlank() && !type.isValidCode(code)) {
            throw new InvalidHsnSacFormatException(
                    String.format("Code '%s' does not match required %s format", code, type.name()));
        }

        if (type == null) {
            throw new InvalidHsnSacFormatException("HSN/SAC type is required");
        }

        if (description == null || description.isBlank()) {
            throw new InvalidHsnSacFormatException("HSN/SAC description is required");
        }

        if (gstSlabId == null) {
            throw new InvalidGstSlabException("GST slab mapping is required");
        }
    }

    public static void validateTaxApplicability(HsnSacMaster hsnSacMaster, BigDecimal taxableAmount) {
        if (hsnSacMaster == null) {
            throw new InvalidTaxApplicabilityException("HSN/SAC record is not available");
        }

        if (hsnSacMaster.getIsDeleted() != null && hsnSacMaster.getIsDeleted()) {
            throw new InvalidTaxApplicabilityException("Deleted HSN/SAC cannot be used for tax calculations");
        }

        if (taxableAmount == null || taxableAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidTaxApplicabilityException("Taxable amount must be a non-negative value");
        }

        if (hsnSacMaster.getGstSlab() == null) {
            throw new InvalidGstSlabException("GST slab mapping is required for HSN/SAC");
        }
    }

    public static void validateGstSlabOwnership(GstSlab gstSlab, Long companyId) {
        if (gstSlab == null) {
            throw new InvalidGstSlabException("GST slab is required");
        }
    }
}
