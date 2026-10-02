package com.erp.account.modules.expense.specification;

import com.erp.account.modules.expense.dto.ExpenseClaimFilterDto;
import com.erp.account.modules.expense.entity.ExpenseClaim;
import com.erp.account.modules.expense.entity.ExpenseClaimItem;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ExpenseClaimSpecification {

    private ExpenseClaimSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<ExpenseClaim> getFilterSpecification(ExpenseClaimFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Company filter
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            // Exclude soft-deleted records
            predicates.add(cb.or(
                    cb.isNull(root.get("isDeleted")),
                    cb.isFalse(root.get("isDeleted"))
            ));

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Search by claim number
            if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
                String searchPattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                Predicate claimNoLike = cb.like(cb.lower(root.get("claimNo")), searchPattern);
                predicates.add(claimNoLike);
            }

            // Status filter
            if (filter.getStatus() != null) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            // Employee filter
            if (filter.getEmployeeId() != null) {
                predicates.add(cb.equal(root.get("employeeId"), filter.getEmployeeId()));
            }

            // Expense Request filter
            if (filter.getExpenseRequestId() != null) {
                predicates.add(cb.equal(root.get("expenseRequestId"), filter.getExpenseRequestId()));
            }

            // Date range filter
            if (filter.getDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("claimDate"), filter.getDateFrom()));
            }

            if (filter.getDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("claimDate"), filter.getDateTo()));
            }

            // Category filter (through items join)
            if (filter.getCategoryId() != null) {
                Join<ExpenseClaim, ExpenseClaimItem> itemsJoin = root.join("items", JoinType.INNER);
                predicates.add(cb.equal(itemsJoin.get("expenseCategory").get("id"), filter.getCategoryId()));
                // Prevent duplicate results from join
                query.distinct(true);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
