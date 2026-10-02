package com.erp.account.modules.fiscalyear.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FyStatisticsDto {
    private Integer totalAccountingPeriods;
    private Integer openPeriods;
    private Integer closedPeriods;
    private Integer totalTransactions;
    private Integer totalVouchers;
    private LocalDate lastTransactionDate;
}
