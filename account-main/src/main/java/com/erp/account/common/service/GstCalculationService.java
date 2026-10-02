package com.erp.account.common.service;

import com.erp.account.modules.company.entity.Company;
import com.erp.account.modules.gstslab.entity.GstSlab;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import com.erp.account.modules.salesinvoice.entity.SalesInvoiceItem;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Slf4j
@Service
public class GstCalculationService {

    /**
     * Extracts the 2-digit state code from an Indian GSTIN.
     */
    public String extractStateCode(String gstin) {
        if (gstin != null && gstin.length() >= 2) {
            return gstin.substring(0, 2);
        }
        return null;
    }

    /**
     * Determines if the transaction is intra-state (same state).
     */
    public boolean isIntraState(String companyGstin, String placeOfSupply) {
        String companyState = extractStateCode(companyGstin);
        // Assuming placeOfSupply contains the 2-digit state code.
        return companyState != null && companyState.equalsIgnoreCase(placeOfSupply);
    }

    /**
     * Calculates the GST amounts for a single line item.
     * Updates the passed SalesInvoiceItem directly.
     * Uses company.getGstin() for state code extraction.
     */
    public void calculateItemTaxes(
            SalesInvoiceItem item,
            Company company,
            SalesInvoice invoice,
            HsnSacMaster hsnSacMaster) {
        // Derive state code from GSTIN for backward compat
        String companyStateCode = extractStateCode(company.getGstin());
        calculateItemTaxes(item, company, invoice, hsnSacMaster, companyStateCode);
    }

    /**
     * Calculates the GST amounts for a single line item.
     * Updates the passed SalesInvoiceItem directly.
     * Accepts an explicit resolvedCompanyStateCode (from GstRegistration) as primary source.
     */
    public void calculateItemTaxes(
            SalesInvoiceItem item,
            Company company,
            SalesInvoice invoice,
            HsnSacMaster hsnSacMaster,
            String resolvedCompanyStateCode) {

        // 1. Calculate Gross Amount, Discount, and Taxable Amount
        BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
        BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal grossAmount = qty.multiply(price).setScale(4, RoundingMode.HALF_UP);

        BigDecimal discountPercentage = item.getDiscountPercentage() != null ? item.getDiscountPercentage() : BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;

        if (discountPercentage.compareTo(BigDecimal.ZERO) > 0) {
            discountAmount = grossAmount.multiply(discountPercentage).divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP);
        } else if (item.getDiscountAmount() != null && item.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            discountAmount = item.getDiscountAmount().setScale(4, RoundingMode.HALF_UP);
            if (grossAmount.compareTo(BigDecimal.ZERO) > 0) {
                discountPercentage = discountAmount.multiply(new BigDecimal("100")).divide(grossAmount, 2, RoundingMode.HALF_UP);
            }
        }

        item.setDiscountPercentage(discountPercentage);
        item.setDiscountAmount(discountAmount);

        BigDecimal discountedAmount = grossAmount.subtract(discountAmount).setScale(4, RoundingMode.HALF_UP);
        if (discountedAmount.compareTo(BigDecimal.ZERO) < 0) {
            discountedAmount = BigDecimal.ZERO;
        }
        item.setDiscountedAmount(discountedAmount);

        BigDecimal taxableAmount = discountedAmount;
        item.setTaxableAmount(taxableAmount);

        // 2. Default taxes to zero
        item.setCgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        item.setSgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        item.setIgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        item.setCessAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        item.setTaxAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));

        item.setHsnSacMaster(hsnSacMaster);

        // 3. Composition Scheme Check (Zero-rating output tax)
        if (company.getIsCompositionScheme() != null && company.getIsCompositionScheme()) {
            item.calculateTotalAmount();
            return;
        }

        // 4. If no GST slab, zero tax
        if (hsnSacMaster == null || hsnSacMaster.getGstSlab() == null) {
            item.calculateTotalAmount();
            return;
        }

        GstSlab slab = hsnSacMaster.getGstSlab();
        String placeOfSupplyStateCode = invoice.getPlaceOfSupplyStateCode();

        // Validate state codes
        if (resolvedCompanyStateCode == null || resolvedCompanyStateCode.trim().isEmpty()) {
            throw new com.erp.account.common.exception.BadRequestException(
                    "Company GST Registration State Code is missing or invalid");
        }
        if (placeOfSupplyStateCode == null || placeOfSupplyStateCode.trim().isEmpty()) {
            throw new com.erp.account.common.exception.BadRequestException("Place of Supply State Code is missing");
        }

        // Primary comparison: Company GST Registration State Code vs Place of Supply State Code
        boolean intraState = resolvedCompanyStateCode.trim().equalsIgnoreCase(placeOfSupplyStateCode.trim());

        log.info("[GST] Item='{}' companyStateCode='{}' placeOfSupplyStateCode='{}' intraState={}",
                item.getItemName(), resolvedCompanyStateCode, placeOfSupplyStateCode, intraState);

        BigDecimal taxTotal = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

        if (intraState) {
            if (slab.getCgstRate() == null || slab.getSgstRate() == null) {
                throw new com.erp.account.common.exception.BadRequestException(
                        "CGST and SGST rates must not be null for intra-state calculation");
            }
            BigDecimal cgst = taxableAmount.multiply(slab.getCgstRate()).divide(new BigDecimal("100"), 4,
                    RoundingMode.HALF_UP);
            item.setCgstAmount(cgst);
            taxTotal = taxTotal.add(cgst);

            BigDecimal sgst = taxableAmount.multiply(slab.getSgstRate()).divide(new BigDecimal("100"), 4,
                    RoundingMode.HALF_UP);
            item.setSgstAmount(sgst);
            taxTotal = taxTotal.add(sgst);
            item.setIgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        } else {
            if (slab.getIgstRate() == null) {
                throw new com.erp.account.common.exception.BadRequestException(
                        "IGST rate must not be null for inter-state calculation");
            }
            BigDecimal igst = taxableAmount.multiply(slab.getIgstRate()).divide(new BigDecimal("100"), 4,
                    RoundingMode.HALF_UP);
            item.setIgstAmount(igst);
            taxTotal = taxTotal.add(igst);
            item.setCgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
            item.setSgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        }

        if (slab.getCessRate() != null) {
            BigDecimal cess = taxableAmount.multiply(slab.getCessRate()).divide(new BigDecimal("100"), 4,
                    RoundingMode.HALF_UP);
            item.setCessAmount(cess);
            taxTotal = taxTotal.add(cess);
        }

        item.setTaxAmount(taxTotal);
        item.calculateTotalAmount();

        log.info("[GST] Item='{}' taxableAmt={} cgstAmt={} sgstAmt={} igstAmt={} taxTotal={}",
                item.getItemName(), taxableAmount, item.getCgstAmount(), item.getSgstAmount(),
                item.getIgstAmount(), taxTotal);
    }

    /**
     * Calculates the GST amounts for a single line item of an AP Invoice.
     * Updates the passed ApInvoiceItem directly.
     */
    public void calculateItemTaxes(
            com.erp.account.modules.apinvoice.entity.ApInvoiceItem item,
            Company company,
            String resolvedGstStateCode,
            HsnSacMaster hsnSacMaster) {

        // 1. Calculate Taxable Amount
        BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ZERO;
        BigDecimal price = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
        BigDecimal taxableAmount = qty.multiply(price).setScale(4, RoundingMode.HALF_UP);
        item.setTaxableAmount(taxableAmount);

        // 2. Default taxes to zero
        item.setCgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        item.setSgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        item.setIgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        item.setCessAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        item.setTaxAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));

        // 3. Composition Scheme Check (Zero-rating output tax)
        if (company.getIsCompositionScheme() != null && company.getIsCompositionScheme()) {
            item.setTotalAmount(taxableAmount.add(item.getTaxAmount()));
            return;
        }

        // 4. If no GST slab, zero tax
        if (hsnSacMaster == null || hsnSacMaster.getGstSlab() == null) {
            item.setTotalAmount(taxableAmount.add(item.getTaxAmount()));
            return;
        }

        GstSlab slab = hsnSacMaster.getGstSlab();
        boolean intraState = isIntraState(company.getGstin(), resolvedGstStateCode);

        BigDecimal taxTotal = BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP);

        String companyStateCode = extractStateCode(company.getGstin());
        if (companyStateCode == null || companyStateCode.isEmpty()) {
            throw new com.erp.account.common.exception.BadRequestException(
                    "Company GST Registration State Code is missing or invalid");
        }
        if (resolvedGstStateCode == null || resolvedGstStateCode.isEmpty()) {
            throw new com.erp.account.common.exception.BadRequestException("Place of Supply State Code is missing");
        }

        if (intraState) {
            if (slab.getCgstRate() == null || slab.getSgstRate() == null) {
                throw new com.erp.account.common.exception.BadRequestException(
                        "CGST and SGST rates must not be null for intra-state calculation");
            }
            BigDecimal cgst = taxableAmount.multiply(slab.getCgstRate()).divide(new BigDecimal("100"), 4,
                    RoundingMode.HALF_UP);
            item.setCgstAmount(cgst);
            taxTotal = taxTotal.add(cgst);

            BigDecimal sgst = taxableAmount.multiply(slab.getSgstRate()).divide(new BigDecimal("100"), 4,
                    RoundingMode.HALF_UP);
            item.setSgstAmount(sgst);
            taxTotal = taxTotal.add(sgst);
            item.setIgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        } else {
            if (slab.getIgstRate() == null) {
                throw new com.erp.account.common.exception.BadRequestException(
                        "IGST rate must not be null for inter-state calculation");
            }
            BigDecimal igst = taxableAmount.multiply(slab.getIgstRate()).divide(new BigDecimal("100"), 4,
                    RoundingMode.HALF_UP);
            item.setIgstAmount(igst);
            taxTotal = taxTotal.add(igst);
            item.setCgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
            item.setSgstAmount(BigDecimal.ZERO.setScale(4, RoundingMode.HALF_UP));
        }

        if (slab.getCessRate() != null) {
            BigDecimal cess = taxableAmount.multiply(slab.getCessRate()).divide(new BigDecimal("100"), 4,
                    RoundingMode.HALF_UP);
            item.setCessAmount(cess);
            taxTotal = taxTotal.add(cess);
        }

        item.setTaxAmount(taxTotal);
        item.setTotalAmount(taxableAmount.add(item.getTaxAmount()));
    }
}
