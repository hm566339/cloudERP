package com.erp.account.modules.budget.specification;

import com.erp.account.modules.budget.dto.request.BudgetHeaderFilterDto;
import com.erp.account.modules.budget.entity.BudgetHeader;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class BudgetHeaderSpecification {

    private BudgetHeaderSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<BudgetHeader> getFilterSpecification(BudgetHeaderFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (filter == null) {
                predicates.add(cb.isFalse(root.get("isDeleted")));
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Deleted status (default to false if null)
            if (filter.getIsDeleted() != null) {
                predicates.add(cb.equal(root.get("isDeleted"), filter.getIsDeleted()));
            } else {
                predicates.add(cb.isFalse(root.get("isDeleted")));
            }

            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate budgetNameMatch = cb.like(cb.lower(root.get("budgetName")), searchPattern);
                predicates.add(budgetNameMatch);
            }

            if (filter.getFiscalYearId() != null) {
                predicates.add(cb.equal(root.get("fiscalYear").get("id"), filter.getFiscalYearId()));
            }

            if (filter.getMinTotalBudget() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("totalBudget"), filter.getMinTotalBudget()));
            }

            if (filter.getMaxTotalBudget() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("totalBudget"), filter.getMaxTotalBudget()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
