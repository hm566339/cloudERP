package com.erp.account.modules.supplierquotation.dto;

import com.erp.account.modules.supplierquotation.entity.SupplierQuotationStatus;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierQuotationResponse {
    private UUID id;
    private UUID companyId;
    private String quotationNumber;
    private UUID rfqId;
    private String rfqNumber;
    private UUID vendorId;
    private String vendorName;
    private LocalDate quotationDate;
    private LocalDate validUntil;
    private String deliveryTerms;
    private String paymentTerms;
    private BigDecimal freight;
    private BigDecimal discount;
    private BigDecimal taxableAmount;
    private BigDecimal cgstAmount;
    private BigDecimal sgstAmount;
    private BigDecimal igstAmount;
    private BigDecimal cessAmount;
    private BigDecimal taxAmount;
    private BigDecimal grandTotal;
    private SupplierQuotationStatus status;
    private UUID awardedBy;
    private LocalDateTime awardedAt;
    private String remarks;
    private List<Item> items;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private UUID id;
        private UUID itemId;
        private String itemName;
        private BigDecimal quantity;
        private String unit;
        private BigDecimal unitPrice;
        private BigDecimal discount;
        private BigDecimal taxableAmount;
        private BigDecimal cgstRate;
        private BigDecimal cgstAmount;
        private BigDecimal sgstRate;
        private BigDecimal sgstAmount;
        private BigDecimal igstRate;
        private BigDecimal igstAmount;
        private BigDecimal cessRate;
        private BigDecimal cessAmount;
        private BigDecimal taxAmount;
        private BigDecimal total;
        private LocalDate deliveryDate;
        private UUID hsnSacId;
    }
}
