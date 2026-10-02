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
public class HsnAggregateSummaryDto {
    @Builder.Default private Integer totalHsnCodes = 0;
    @Builder.Default private BigDecimal totalQuantity = BigDecimal.ZERO;
    @Builder.Default private BigDecimal totalTaxableValue = BigDecimal.ZERO;
    @Builder.Default private BigDecimal totalCgst = BigDecimal.ZERO;
    @Builder.Default private BigDecimal totalSgst = BigDecimal.ZERO;
    @Builder.Default private BigDecimal totalIgst = BigDecimal.ZERO;
    @Builder.Default private BigDecimal totalCess = BigDecimal.ZERO;
}
