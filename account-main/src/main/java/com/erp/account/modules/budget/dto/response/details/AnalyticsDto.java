package com.erp.account.modules.budget.dto.response.details;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsDto implements Serializable {
    private Long transactionCount;
    private BigDecimal averageMonthlyExpense;
    private BigDecimal highestExpense;
    private BigDecimal lowestExpense;
    private LocalDateTime lastExpenseDate;
    private Integer totalAttachments;
}
