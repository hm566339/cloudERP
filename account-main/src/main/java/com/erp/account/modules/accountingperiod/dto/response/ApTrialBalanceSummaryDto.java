package com.erp.account.modules.accountingperiod.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApTrialBalanceSummaryDto {
    private BigDecimal totalDebit;
    private BigDecimal totalCredit;
    private BigDecimal difference;
}
