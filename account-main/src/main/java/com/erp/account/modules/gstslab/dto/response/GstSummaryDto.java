package com.erp.account.modules.gstslab.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GstSummaryDto {
    private BigDecimal totalTaxableValue;
    private BigDecimal totalCgstCollected;
    private BigDecimal totalSgstCollected;
    private BigDecimal totalIgstCollected;
    private BigDecimal totalCessCollected;
    private BigDecimal totalGstAmount;
}
