package com.erp.account.modules.report.gst.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Gstr2bReconciliationDto implements Serializable {

    private Gstr2bSummaryDto summary;
    private List<Gstr2bItemDto> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Gstr2bItemDto implements Serializable {
        private String gstin;
        private String supplierName;
        private String invoiceNumber;
        private LocalDate invoiceDate;
        private BigDecimal booksTaxableValue;
        private BigDecimal portalTaxableValue;
        private BigDecimal booksTaxAmount;
        private BigDecimal portalTaxAmount;
        private BigDecimal differenceAmount;
        private String status; // MATCHED, MISMATCHED_AMOUNT, MISSING_IN_2B, MISSING_IN_BOOKS
        private String remarks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Gstr2bSummaryDto implements Serializable {
        private long matchedCount;
        private BigDecimal matchedTaxableAmount;
        private long mismatchedCount;
        private BigDecimal mismatchedTaxableAmount;
        private long missingIn2bCount;
        private BigDecimal missingIn2bTaxableAmount;
        private long missingInBooksCount;
        private BigDecimal missingInBooksTaxableAmount;
    }
}
