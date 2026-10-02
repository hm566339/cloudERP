package com.erp.account.modules.ledger.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoaFinancialSummaryDto {
    private BigDecimal currentMonthDebit;
    private BigDecimal currentMonthCredit;
    private BigDecimal financialYearDebit;
    private BigDecimal financialYearCredit;
    private BigDecimal netMovement;
}
