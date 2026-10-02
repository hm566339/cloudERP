package com.erp.account.util;

import com.erp.account.modules.budget.dto.response.BudgetLineSummaryResponse;
import com.erp.account.modules.budget.dto.response.BudgetVarianceResponse;
import com.erp.account.enums.VarianceType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class BudgetReportHelper {

    private BudgetReportHelper() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static BudgetLineSummaryResponse buildSummaryResponse(
            UUID companyId,
            List<BudgetVarianceResponse> varianceResponses,
            BigDecimal totalAllocated,
            BigDecimal totalUtilized,
            BigDecimal totalRemaining) {
        int totalBudgetLines = varianceResponses != null ? varianceResponses.size() : 0;
        int overAllocatedLines = (int) varianceResponses.stream()
                .filter(v -> v.getRemainingAmount() != null && v.getRemainingAmount().compareTo(BudgetLineConstants.ZERO) < 0)
                .count();
        int underUtilizedLines = (int) varianceResponses.stream()
                .filter(v -> v.getVarianceAmount() != null && v.getVarianceAmount().compareTo(BudgetLineConstants.ZERO) > 0)
                .count();

        BigDecimal averageUtilization = BudgetLineConstants.ZERO;
        if (totalAllocated != null && totalAllocated.compareTo(BudgetLineConstants.ZERO) > 0) {
            averageUtilization = totalUtilized
                    .divide(totalAllocated, BudgetLineConstants.AMOUNT_SCALE + 2, BudgetLineConstants.ROUNDING_MODE)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(BudgetLineConstants.AMOUNT_SCALE, BudgetLineConstants.ROUNDING_MODE);
        }

        return BudgetLineSummaryResponse.builder()
                .companyId(companyId)
                .totalAllocated(BudgetUtilizationHelper.normalizeAmount(totalAllocated))
                .totalUtilized(BudgetUtilizationHelper.normalizeAmount(totalUtilized))
                .totalRemaining(BudgetUtilizationHelper.normalizeAmount(totalRemaining))
                .averageUtilizationPercentage(averageUtilization)
                .totalBudgetLines(totalBudgetLines)
                .overAllocatedLines(overAllocatedLines)
                .underUtilizedLines(underUtilizedLines)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    public static String formatVarianceType(BigDecimal varianceAmount) {
        VarianceType type = BudgetVarianceHelper.determineVarianceType(varianceAmount);
        return type.name();
    }
}
