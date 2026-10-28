package com.erp.account.modules.einvoice.provider.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Canonical e-Invoice representation mapped directly from ERP invoice
 * and conforming to the Indian GST IRP JSON Schema v1.04.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EInvoiceCanonicalPayload {

    private String version; // "1.04"

    // Document Details
    private String docType; // "INV", "CRN", "DBN"
    private String docNumber;
    private LocalDate docDate;

    // Transaction Details
    private String taxScheme; // "GST"
    private String supplyType; // "B2B", "SEZWP", "SEZWOP", "EXPWP", "EXPWOP", "DEXP"
    private String reverseCharge; // "Y" or "N"
    private String igstOnIntra; // "Y" or "N"

    // Seller Details
    private SellerDetails seller;

    // Buyer Details
    private BuyerDetails buyer;

    // Items
    private List<ItemDetails> items;

    // Value Summary
    private ValueDetails values;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SellerDetails {
        private String gstin;
        private String legalName;
        private String tradeName;
        private String address1;
        private String address2;
        private String location;
        private String pincode;
        private String stateCode;
        private String phone;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BuyerDetails {
        private String gstin;
        private String legalName;
        private String tradeName;
        private String placeOfSupply;
        private String address1;
        private String address2;
        private String location;
        private String pincode;
        private String stateCode;
        private String phone;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDetails {
        private String itemSerialNo;
        private String productDescription;
        private String isService; // "Y" or "N"
        private String hsnCode;
        private BigDecimal quantity;
        private String unitOfMeasurement;
        private BigDecimal unitPrice;
        private BigDecimal totalAmount;
        private BigDecimal discount;
        private BigDecimal taxableAmount;
        private BigDecimal gstRate;
        private BigDecimal cgstAmount;
        private BigDecimal sgstAmount;
        private BigDecimal igstAmount;
        private BigDecimal cessAmount;
        private BigDecimal totalItemValue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValueDetails {
        private BigDecimal totalTaxableAmount;
        private BigDecimal totalCgstAmount;
        private BigDecimal totalSgstAmount;
        private BigDecimal totalIgstAmount;
        private BigDecimal totalCessAmount;
        private BigDecimal totalDiscount;
        private BigDecimal otherCharges;
        private BigDecimal roundOffAmount;
        private BigDecimal totalInvoiceValue;
    }
}
