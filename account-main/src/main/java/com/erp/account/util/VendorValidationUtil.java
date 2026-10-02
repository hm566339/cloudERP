package com.erp.account.util;

import com.erp.account.common.exception.*;
import com.erp.account.modules.vendor.entity.Vendor;
import com.erp.account.modules.vendor.repository.VendorRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;
import com.erp.account.common.exception.CreditLimitExceededException;
import com.erp.account.common.exception.DuplicateVendorCodeException;
import com.erp.account.common.exception.ValidationException;
import com.erp.account.common.exception.VendorDeletedException;
import com.erp.account.common.exception.VendorInactiveException;
import com.erp.account.common.exception.VendorNotFoundException;
import com.erp.account.common.exception.VendorTransactionExistsException;

@Slf4j
@Component
public class VendorValidationUtil {

    private final VendorRepository vendorRepository;

    public VendorValidationUtil(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    /**
     * Validate vendor before creation
     */
    public void validateVendorForCreation(String vendorCode, UUID companyId) {
        if (vendorCode == null || vendorCode.isBlank()) {
            return;
        }
        validateVendorCodeFormat(vendorCode);

        boolean exists = vendorRepository
                .findByVendorCodeAndCompanyId(vendorCode, companyId)
                .isPresent();

        if (exists) {
            throw new DuplicateVendorCodeException(vendorCode, companyId);
        }
    }

    public void validateVendorForUpdate(
            String vendorCode,
            UUID companyId,
            UUID excludeVendorId) {
        if (vendorCode == null || vendorCode.isBlank()) {
            return;
        }
        validateVendorCodeFormat(vendorCode);

        vendorRepository.findByVendorCodeAndCompanyId(vendorCode, companyId)
                .ifPresent(existingVendor -> {
                    if (!existingVendor.getId().equals(excludeVendorId)) {
                        throw new DuplicateVendorCodeException(vendorCode, companyId);
                    }
                });
    }

    public void validateVendorIsActive(Vendor vendor) {
        if (vendor == null || Boolean.FALSE.equals(vendor.getIsActive())) {
            throw new VendorInactiveException(vendor != null ? vendor.getVendorCode() : "UNKNOWN");
        }
    }

    public void validateVendorIsNotDeleted(Vendor vendor) {
        if (vendor == null || Boolean.TRUE.equals(vendor.getIsDeleted())) {
            throw new VendorDeletedException(vendor != null ? vendor.getVendorCode() : "UNKNOWN");
        }
    }

    public void validateVendorExists(UUID vendorId) {
        boolean exists = vendorRepository
                .findByIdAndNotDeleted(vendorId)
                .isPresent();

        if (!exists) {
            throw VendorNotFoundException.byId(vendorId);
        }
    }

    public void validateCreditLimit(BigDecimal creditLimit) {
        if (creditLimit != null && creditLimit.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Credit limit cannot be negative");
        }
    }

    public void validateOpeningBalance(BigDecimal openingBalance) {
        if (openingBalance != null && openingBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Opening balance cannot be negative");
        }
    }

    public void validatePaymentTermDays(Integer paymentTermDays) {
        if (paymentTermDays != null && paymentTermDays < 0) {
            throw new ValidationException("Payment term days cannot be negative");
        }
    }

    public void validateTds(Boolean tdsApplicable, String tdsSection, BigDecimal tdsRate) {
        log.info("TdsApplicable={}, TdsRate={}, TdsSection={}", tdsApplicable, tdsRate, tdsSection);
        if (!Boolean.TRUE.equals(tdsApplicable)) {
            return;
        }
        if (tdsSection == null || tdsSection.isBlank()) {
            throw new ValidationException("TDS section is mandatory when TDS applies");
        }
        if (tdsRate == null || tdsRate.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ValidationException("TDS rate must be greater than zero when TDS applies");
        }
    }

    public void validateDuplicateGstin(String gstin, UUID companyId, UUID currentVendorId) {
        if (gstin == null || gstin.isBlank()) {
            return;
        }
        vendorRepository.findByGstinAndCompanyId(gstin, companyId)
                .ifPresent(existing -> {
                    if (currentVendorId == null || !existing.getId().equals(currentVendorId)) {
                        throw new ValidationException("Vendor with GSTIN " + gstin + " already exists.");
                    }
                });
    }

    public void validateDuplicatePan(String panNo, UUID companyId, UUID currentVendorId) {
        if (panNo == null || panNo.isBlank()) {
            return;
        }
        vendorRepository.findByPanNoAndCompanyId(panNo, companyId)
                .ifPresent(existing -> {
                    if (currentVendorId == null || !existing.getId().equals(currentVendorId)) {
                        throw new ValidationException("Vendor with PAN " + panNo + " already exists.");
                    }
                });
    }

    /**
     * Validate vendor credit limit
     */
    public void validateVendorCreditLimit(
            Vendor vendor,
            BigDecimal creditLimit,
            BigDecimal outstandingAmount) {

        if (creditLimit != null && outstandingAmount != null) {

            if (outstandingAmount.compareTo(creditLimit) > 0) {

                BigDecimal exceededAmount = outstandingAmount.subtract(creditLimit);

                throw new CreditLimitExceededException(
                        vendor.getVendorCode(),
                        creditLimit,
                        exceededAmount);
            }
        }
    }

    /**
     * Validate vendor not used in transactions
     */
    public void validateVendorNotInTransaction(UUID vendorId, UUID companyId) {

        long invoiceCount = vendorRepository.countActiveInvoicesByVendor(vendorId, companyId);

        long paymentCount = vendorRepository.countActivePaymentsByVendor(vendorId, companyId);

        if (invoiceCount > 0 || paymentCount > 0) {

            throw new VendorTransactionExistsException(vendorId);
        }
    }

    /**
     * Validate vendor code format
     */
    public void validateVendorCodeFormat(String vendorCode) {
        if (vendorCode == null || vendorCode.trim().isEmpty()) {
            return;
        }

        if (vendorCode.length() > 50) {

            throw new ValidationException(
                    "Vendor code cannot exceed 50 characters");
        }
    }

    /**
     * Validate vendor name format
     */
    public void validateVendorNameFormat(String vendorName) {

        if (vendorName == null || vendorName.trim().isEmpty()) {

            throw new ValidationException(
                    "Vendor name cannot be empty");
        }

        if (vendorName.length() > 255) {

            throw new ValidationException(
                    "Vendor name cannot exceed 255 characters");
        }
    }

    /**
     * Validate email
     */
    public void validateEmail(String email) {

        if (email != null && !email.trim().isEmpty()) {

            String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$";

            if (!email.matches(emailRegex)) {

                throw new ValidationException(
                        "Invalid email format: " + email);
            }
        }
    }

    /**
     * Validate phone
     */
    public void validatePhone(String phone) {

        if (phone != null && !phone.trim().isEmpty()) {

            // Fixed Java escape characters
            String phoneRegex = "^\\+?[0-9\\- ]{7,20}$";

            if (!phone.matches(phoneRegex)) {

                throw new ValidationException(
                        "Invalid phone format: " + phone);
            }
        }
    }

    /**
     * Validate currency format
     */
    public void validateDefaultCurrency(String defaultCurrency) {
        if (defaultCurrency != null && !defaultCurrency.isBlank()) {
            String trimmed = defaultCurrency.trim();
            if (trimmed.length() != 3) {
                throw new ValidationException("Currency must be a 3-letter ISO code.");
            }
            try {
                java.util.Currency.getInstance(trimmed.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new ValidationException("Currency must be a 3-letter ISO code.");
            }
        }
    }
}
