package com.erp.account.util;

import com.erp.account.enums.VarianceType;

import java.math.BigDecimal;

public final class BudgetVarianceHelper {

    private BudgetVarianceHelper() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static BigDecimal calculateVariance(BigDecimal allocatedAmount, BigDecimal actualExpense) {
        BigDecimal allocated = BudgetUtilizationHelper.normalizeAmount(allocatedAmount);
        BigDecimal expense = BudgetUtilizationHelper.normalizeAmount(actualExpense);
        return allocated.subtract(expense).setScale(BudgetLineConstants.AMOUNT_SCALE, BudgetLineConstants.ROUNDING_MODE);
    }

    public static BigDecimal calculateVariancePercentage(BigDecimal allocatedAmount, BigDecimal actualExpense) {
        BigDecimal allocated = BudgetUtilizationHelper.normalizeAmount(allocatedAmount);
        BigDecimal expense = BudgetUtilizationHelper.normalizeAmount(actualExpense);

        if (allocated.compareTo(BudgetLineConstants.ZERO) <= 0) {
            return BudgetLineConstants.ZERO;
        }

        return calculateVariance(allocated, expense)
                .divide(allocated, BudgetLineConstants.AMOUNT_SCALE + 2, BudgetLineConstants.ROUNDING_MODE)
                .multiply(BigDecimal.valueOf(100))
                .setScale(BudgetLineConstants.AMOUNT_SCALE, BudgetLineConstants.ROUNDING_MODE);
    }

    public static VarianceType determineVarianceType(BigDecimal varianceAmount) {
        BigDecimal normalized = BudgetUtilizationHelper.normalizeAmount(varianceAmount);

        if (normalized.compareTo(BudgetLineConstants.ZERO) > 0) {
            return VarianceType.FAVORABLE;
        }

        if (normalized.compareTo(BudgetLineConstants.ZERO) < 0) {
            return VarianceType.UNFAVORABLE;
        }

        return VarianceType.BREAKEVEN;
    }
}
