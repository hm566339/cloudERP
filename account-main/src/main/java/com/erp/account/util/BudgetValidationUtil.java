package com.erp.account.util;

import com.erp.account.modules.budget.dto.request.BudgetHeaderRequest;
import com.erp.account.modules.budget.dto.request.BudgetLineRequest;
import com.erp.account.common.exception.InvalidBudgetRequestException;

import java.math.BigDecimal;

public final class BudgetValidationUtil {

    private BudgetValidationUtil() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static void validateBudgetHeaderRequest(BudgetHeaderRequest request) {
        if (request == null) {
            throw new InvalidBudgetRequestException("Budget header request is required");
        }

        if (request.getFiscalYearId() == null) {
            throw new InvalidBudgetRequestException("Fiscal year is required");
        }

        if (request.getBudgetName() == null || request.getBudgetName().isBlank()) {
            throw new InvalidBudgetRequestException("Budget name is required");
        }

        if (request.getTotalBudget() == null || request.getTotalBudget().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidBudgetRequestException("Total budget must be a positive amount");
        }
    }

    public static void validateBudgetLineRequest(BudgetLineRequest request) {
        if (request == null) {
            throw new InvalidBudgetRequestException("Budget line request is required");
        }

        if (request.getAccountId() == null) {
            throw new InvalidBudgetRequestException("Account reference is required");
        }

        if (request.getAllocatedAmount() == null || request.getAllocatedAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new InvalidBudgetRequestException("Allocated amount must be a non-negative value");
        }
    }

    public static void validateBudgetLineRequestWithBudgetHeaderId(BudgetLineRequest request) {
        validateBudgetLineRequest(request);

        if (request.getBudgetHeaderId() == null) {
            throw new InvalidBudgetRequestException("Budget header reference is required");
        }
    }
}
