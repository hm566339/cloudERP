package com.erp.account.modules.report.gst.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Gstr3bDto {
    
    @Builder.Default
    private ReportInfo reportInfo = new ReportInfo();
    
    @Builder.Default
    private OutwardSupplies outwardSupplies = new OutwardSupplies();
    
    @Builder.Default
    private ZeroRatedSupplies zeroRatedSupplies = new ZeroRatedSupplies();
    
    @Builder.Default
    private NilRatedExemptSupplies nilRatedExemptSupplies = new NilRatedExemptSupplies();
    
    @Builder.Default
    private InwardReverseChargeSupplies inwardReverseChargeSupplies = new InwardReverseChargeSupplies();
    
    @Builder.Default
    private NonGstOutwardSupplies nonGstOutwardSupplies = new NonGstOutwardSupplies();
    
    @Builder.Default
    private Imports imports = new Imports();
    
    @Builder.Default
    private InputTaxCredit inputTaxCredit = new InputTaxCredit();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReportInfo {
        private String reportName;
        private String reportingPeriod;
        private String generatedAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class OutwardSupplies {
        @Builder.Default private BigDecimal taxableAmount = BigDecimal.ZERO;
        @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal cgst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal sgst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ZeroRatedSupplies {
        @Builder.Default private BigDecimal taxableAmount = BigDecimal.ZERO;
        @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NilRatedExemptSupplies {
        @Builder.Default private BigDecimal taxableAmount = BigDecimal.ZERO;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InwardReverseChargeSupplies {
        @Builder.Default private BigDecimal taxableAmount = BigDecimal.ZERO;
        @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal cgst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal sgst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NonGstOutwardSupplies {
        @Builder.Default private BigDecimal taxableAmount = BigDecimal.ZERO;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Imports {
        @Builder.Default private Goods goods = new Goods();
        @Builder.Default private Services services = new Services();

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class Goods {
            @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class Services {
            @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InputTaxCredit {
        @Builder.Default private InwardReverseChargeItc inwardReverseChargeItc = new InwardReverseChargeItc();
        @Builder.Default private AllOtherItc allOtherItc = new AllOtherItc();
        @Builder.Default private TotalItc totalItc = new TotalItc();

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class InwardReverseChargeItc {
            @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal cgst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal sgst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class AllOtherItc {
            @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal cgst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal sgst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class TotalItc {
            @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal cgst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal sgst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
        }

        @Builder.Default private ItcReversed itcReversed = new ItcReversed();
        @Builder.Default private NetItcAvailable netItcAvailable = new NetItcAvailable();

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class ItcReversed {
            @Builder.Default private BigDecimal rule42And43 = BigDecimal.ZERO;
            @Builder.Default private BigDecimal section175 = BigDecimal.ZERO;
            @Builder.Default private BigDecimal others = BigDecimal.ZERO;
        }

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class NetItcAvailable {
            @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal cgst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal sgst = BigDecimal.ZERO;
            @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
        }
    }

    @Builder.Default private NetLiability netLiability = new NetLiability();
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class NetLiability {
        @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal cgst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal sgst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
    }

    @Builder.Default private ElectronicCreditLedger electronicCreditLedger = new ElectronicCreditLedger();
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ElectronicCreditLedger {
        @Builder.Default private BigDecimal openingBalance = BigDecimal.ZERO;
        @Builder.Default private BigDecimal itcClaimed = BigDecimal.ZERO;
        @Builder.Default private BigDecimal itcUtilized = BigDecimal.ZERO;
        @Builder.Default private BigDecimal closingBalance = BigDecimal.ZERO;
    }
}
