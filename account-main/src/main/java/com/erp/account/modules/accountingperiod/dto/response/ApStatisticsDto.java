package com.erp.account.modules.accountingperiod.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApStatisticsDto {
    private Integer totalTransactions;
    private Integer totalVouchers;
    private BigDecimal totalSales;
    private BigDecimal totalPurchases;
    private BigDecimal totalReceipts;
    private BigDecimal totalPayments;
    private LocalDate lastTransactionDate;
}
