package com.erp.account.modules.bankaccount.dto.response.profile;

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
public class BankStatisticsDto {
    private Integer totalTransactions;
    private Integer totalReceipts;
    private Integer totalPayments;
    private BigDecimal totalDeposits;
    private BigDecimal totalWithdrawals;
    private BigDecimal averageMonthlyBalance;
    private LocalDate lastTransactionDate;
}
