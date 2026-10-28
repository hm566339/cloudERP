package com.erp.account.modules.einvoice.service;

import com.erp.account.common.exception.BadRequestException;
import com.erp.account.common.exception.ConflictException;
import com.erp.account.enums.EinvoiceStatus;
import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.gst.entity.GstRegistration;
import com.erp.account.modules.gst.repository.GstRegistrationRepository;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Strict validator for GST e-Invoice eligibility and statutory schema compliance.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EInvoiceValidator {

    private static final Pattern GSTIN_PATTERN = Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");
    private static final Pattern PINCODE_PATTERN = Pattern.compile("^[1-9][0-9]{5}$");

    private final GstRegistrationRepository gstRegistrationRepository;

    /**
     * Pre-flight validation before creating an e-Invoice generation job.
     */
    public GstRegistration validateEligibilityAndResolveGstin(SalesInvoice invoice, UUID requestedGstRegistrationId) {
        if (invoice == null) {
            throw new BadRequestException("Sales invoice not found", "INVOICE_NOT_FOUND");
        }

        // 1. Invoice Status Check: Must be APPROVED or POSTED/PAID, cannot be DRAFT or CANCELLED
        InvoiceStatus invStatus = invoice.getStatus();
        if (invStatus == InvoiceStatus.DRAFT || invStatus == InvoiceStatus.PENDING_APPROVAL) {
            throw new BadRequestException("Invoice must be approved before e-Invoice can be generated. Current status: " + invStatus, "INVOICE_NOT_APPROVED");
        }
        if (invStatus == InvoiceStatus.CANCELLED || invStatus == InvoiceStatus.VOIDED || invStatus == InvoiceStatus.REJECTED) {
            throw new BadRequestException("Cannot generate e-Invoice for a cancelled or voided invoice", "INVOICE_INACTIVE");
        }

        // 2. e-Invoice State Check: Check if already GENERATED, QUEUED, or PROCESSING
        if (invoice.getEinvoiceStatus() == EinvoiceStatus.GENERATED) {
            throw new ConflictException("e-Invoice already generated for invoice " + invoice.getInvoiceNumber() + ". IRN: " + invoice.getIrn());
        }
        if (invoice.getEinvoiceStatus() == EinvoiceStatus.QUEUED || invoice.getEinvoiceStatus() == EinvoiceStatus.PROCESSING) {
            throw new ConflictException("e-Invoice generation is already in progress for invoice " + invoice.getInvoiceNumber());
        }

        // 3. Resolve Issuing Supplier GSTIN
        GstRegistration supplierRegistration = resolveSupplierRegistration(invoice, requestedGstRegistrationId);
        if (supplierRegistration == null || !StringUtils.hasText(supplierRegistration.getGstin())) {
            throw new BadRequestException("No valid GST registration found for company " + invoice.getCompanyId() + ". Please configure GSTIN under GST Master.", "MISSING_SUPPLIER_GSTIN");
        }

        String supplierGstin = supplierRegistration.getGstin().trim().toUpperCase();
        if (!GSTIN_PATTERN.matcher(supplierGstin).matches()) {
            throw new BadRequestException("Invalid supplier GSTIN format: " + supplierGstin, "INVALID_SUPPLIER_GSTIN");
        }

        // 4. Validate Buyer Details
        Customer customer = invoice.getCustomer();
        if (customer == null) {
            throw new BadRequestException("Invoice does not have an associated customer", "MISSING_CUSTOMER");
        }

        String buyerGstin = customer.getGstin() != null ? customer.getGstin().trim().toUpperCase() : null;
        if (!StringUtils.hasText(buyerGstin)) {
            throw new BadRequestException("Buyer GSTIN is required for B2B e-Invoicing under GST Rule 48(4).", "MISSING_BUYER_GSTIN");
        }
        if (!GSTIN_PATTERN.matcher(buyerGstin).matches()) {
            throw new BadRequestException("Invalid buyer GSTIN format: " + buyerGstin, "INVALID_BUYER_GSTIN");
        }

        // 5. Validate Line Items & Values
        if (invoice.getSalesInvoiceItems() == null || invoice.getSalesInvoiceItems().isEmpty()) {
            throw new BadRequestException("Invoice must have at least one line item to generate e-Invoice", "NO_LINE_ITEMS");
        }

        for (SalesInvoiceItem item : invoice.getSalesInvoiceItems()) {
            if (item.getIsDeleted() != null && item.getIsDeleted()) {
                continue;
            }
            if (item.getQuantity() == null || item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Line item quantity must be greater than zero", "INVALID_QUANTITY");
            }
            String hsnCode = item.getHsnSacMaster() != null ? item.getHsnSacMaster().getCode() : null;
            if (!StringUtils.hasText(hsnCode)) {
                throw new BadRequestException("HSN/SAC code is mandatory for all items under e-Invoicing rules", "MISSING_HSN");
            }
        }

        if (invoice.getTotalAmount() == null || invoice.getTotalAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Total invoice amount must be positive", "INVALID_INVOICE_TOTAL");
        }

        return supplierRegistration;
    }

    private GstRegistration resolveSupplierRegistration(SalesInvoice invoice, UUID requestedGstRegistrationId) {
        if (requestedGstRegistrationId != null) {
            return gstRegistrationRepository.findById(requestedGstRegistrationId)
                    .filter(r -> r.getCompanyId().equals(invoice.getCompanyId()) && !r.getIsDeleted())
                    .orElseThrow(() -> new BadRequestException("Requested GST registration does not belong to this company", "INVALID_GST_REGISTRATION"));
        }
        if (invoice.getGstRegistrationId() != null) {
            return gstRegistrationRepository.findById(invoice.getGstRegistrationId())
                    .filter(r -> !r.getIsDeleted())
                    .orElse(null);
        }
        // Fallback to default registration for company
        return gstRegistrationRepository.findByCompanyIdAndIsDefaultTrueAndIsDeletedFalse(invoice.getCompanyId())
                .orElse(null);
    }
}
