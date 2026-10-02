package com.erp.account.modules.bankaccount.dto.response.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BalanceSummaryDto {
    private BigDecimal openingBalance;
    private BigDecimal currentBalance;
    private BigDecimal reconciledBalance;
    private BigDecimal availableBalance;
    private BigDecimal unclearedAmount;
    private BigDecimal closingBalance;
}
