package com.erp.account.util;

import java.math.BigDecimal;

public final class BudgetUtilizationHelper {

    private BudgetUtilizationHelper() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static BigDecimal normalizeAmount(BigDecimal amount) {
        if (amount == null) {
            return BudgetLineConstants.ZERO;
        }
        return amount.setScale(BudgetLineConstants.AMOUNT_SCALE, BudgetLineConstants.ROUNDING_MODE);
    }

    public static BigDecimal calculateRemainingAmount(BigDecimal allocatedAmount, BigDecimal utilizedAmount) {
        BigDecimal allocated = normalizeAmount(allocatedAmount);
        BigDecimal utilized = normalizeAmount(utilizedAmount);
        return allocated.subtract(utilized).setScale(BudgetLineConstants.AMOUNT_SCALE, BudgetLineConstants.ROUNDING_MODE);
    }

    public static BigDecimal calculateUtilizationPercentage(BigDecimal allocatedAmount, BigDecimal utilizedAmount) {
        BigDecimal allocated = normalizeAmount(allocatedAmount);
        BigDecimal utilized = normalizeAmount(utilizedAmount);

        if (allocated.compareTo(BudgetLineConstants.ZERO) <= 0) {
            return BudgetLineConstants.ZERO;
        }

        return utilized.divide(allocated, BudgetLineConstants.AMOUNT_SCALE + 2, BudgetLineConstants.ROUNDING_MODE)
                .multiply(BigDecimal.valueOf(100))
                .setScale(BudgetLineConstants.AMOUNT_SCALE, BudgetLineConstants.ROUNDING_MODE);
    }
}
