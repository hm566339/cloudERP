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
public class GroupBalanceSummaryDto {
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private BigDecimal netBalance;
    private BigDecimal openingBalance;
    private BigDecimal closingBalance;
}
