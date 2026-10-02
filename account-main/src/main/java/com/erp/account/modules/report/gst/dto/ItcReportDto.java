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
public class ItcReportDto {
    
    @Builder.Default
    private Gstr3bDto.ReportInfo reportInfo = new Gstr3bDto.ReportInfo();
    
    @Builder.Default
    private BigDecimal openingBalance = BigDecimal.ZERO;
    
    @Builder.Default
    private ItcBreakdown itcAvailed = new ItcBreakdown();
    
    @Builder.Default
    private ItcBreakdown itcUtilized = new ItcBreakdown();
    
    @Builder.Default
    private ItcSummary summary = new ItcSummary();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItcBreakdown {
        @Builder.Default private BigDecimal cgst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal sgst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal igst = BigDecimal.ZERO;
        @Builder.Default private BigDecimal cess = BigDecimal.ZERO;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItcSummary {
        @Builder.Default private BigDecimal totalItcAvailed = BigDecimal.ZERO;
        @Builder.Default private BigDecimal totalItcUtilized = BigDecimal.ZERO;
        @Builder.Default private BigDecimal netItcAvailable = BigDecimal.ZERO;
        @Builder.Default private BigDecimal closingBalance = BigDecimal.ZERO;
    }
}
