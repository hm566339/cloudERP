package com.erp.account.modules.report.gst.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Gstr2bReconciliationRequest implements Serializable {

    private UUID companyId;
    private LocalDate fromDate;
    private LocalDate toDate;
    private List<Gstr2bPortalEntry> portalEntries;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Gstr2bPortalEntry implements Serializable {
        private String gstin;
        private String supplierName;
        private String invoiceNumber;
        private LocalDate invoiceDate;
        private BigDecimal taxableValue;
        private BigDecimal cgst;
        private BigDecimal sgst;
        private BigDecimal igst;
        private BigDecimal cess;
    }
}
