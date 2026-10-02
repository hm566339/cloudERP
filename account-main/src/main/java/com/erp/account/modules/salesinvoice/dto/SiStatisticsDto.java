package com.erp.account.modules.salesinvoice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiStatisticsDto {
    private Integer itemCount;
    private Integer paymentCount;
    private Integer creditNoteCount;
    private Integer taxTransactionCount;
    private Integer daysOutstanding;
    private String agingBucket;
    private BigDecimal interestAccrued;
}
