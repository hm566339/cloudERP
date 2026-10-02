package com.erp.account.modules.expense.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseReportSummaryResponse {
    
    @Builder.Default
    private BigDecimal totalRecordedExpenses = BigDecimal.ZERO;
    
    @Builder.Default
    private long totalRecordedExpenseCount = 0;
    
    @Builder.Default
    private BigDecimal pendingAdvanceRequests = BigDecimal.ZERO;
    
    @Builder.Default
    private BigDecimal pendingReimbursementDue = BigDecimal.ZERO;
    
    @Builder.Default
    private BigDecimal totalReimbursementsSettled = BigDecimal.ZERO;
}
