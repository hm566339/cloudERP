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
public class BankReconciliationSnippetDto {
    private String reconciliationStatus;
    private LocalDate lastReconciliationDate;
    private BigDecimal clearedBalance;
    private BigDecimal unclearedDeposits;
    private BigDecimal outstandingCheques;
    private BigDecimal reconciliationDifference;
}
