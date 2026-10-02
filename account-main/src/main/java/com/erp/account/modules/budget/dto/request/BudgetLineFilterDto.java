package com.erp.account.modules.budget.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetLineFilterDto {

    private UUID budgetHeaderId;
    private UUID accountId;
    private UUID departmentId;
    private UUID fiscalYearId;

    private BigDecimal minAllocatedAmount;
    private BigDecimal maxAllocatedAmount;
    private BigDecimal minUtilizedAmount;
    private BigDecimal maxUtilizedAmount;
    private BigDecimal minRemainingAmount;
    private BigDecimal maxRemainingAmount;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate fromDate;

    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
    private LocalDate toDate;

    private String searchKeyword;
    private Boolean isDeleted;
}
