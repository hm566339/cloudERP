package com.erp.account.util;

import com.erp.account.common.exception.BudgetExceededException;
import com.erp.account.common.exception.InvalidBudgetStatusException;

import java.math.BigDecimal;

public final class BudgetControlHelper {

    private BudgetControlHelper() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static void validateAllocatedAmount(BigDecimal allocatedAmount) {
        if (allocatedAmount == null || allocatedAmount.compareTo(BudgetLineConstants.ZERO) < 0) {
            throw new BudgetExceededException("Allocated amount must be a positive or zero value");
        }
    }

    public static void validateUtilizedAmount(BigDecimal utilizedAmount) {
        if (utilizedAmount == null || utilizedAmount.compareTo(BudgetLineConstants.ZERO) < 0) {
            throw new BudgetExceededException("Utilized amount must be a positive or zero value");
        }
    }

    public static void validateBudgetAvailability(BigDecimal remainingBudget, BigDecimal expenseAmount) {
        BigDecimal normalizedExpense = BudgetUtilizationHelper.normalizeAmount(expenseAmount);
        if (normalizedExpense.compareTo(remainingBudget) > 0) {
            throw new BudgetExceededException("Expense amount exceeds remaining budget allocation");
        }
    }

    public static void validateBudgetStatus(boolean editable, String errorMessage) {
        if (!editable) {
            throw new InvalidBudgetStatusException(errorMessage);
        }
    }
}
