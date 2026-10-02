package com.erp.account.modules.accountgroup.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupStatisticsDto {
    private Integer totalChildGroups;
    private Integer totalLedgerAccounts;
    private Integer totalActiveLedgers;
    private Integer totalInactiveLedgers;
    private BigDecimal totalDebitAmount;
    private BigDecimal totalCreditAmount;
    private BigDecimal netBalance;
}
