package com.erp.account.modules.expensecategory.specification;

import com.erp.account.modules.expense.entity.ExpenseCategory;
import com.erp.account.modules.expensecategory.dto.request.ExpenseCategoryFilterDto;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ExpenseCategorySpecification {

    public static Specification<ExpenseCategory> getFilterSpecification(ExpenseCategoryFilterDto filter) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Not deleted
            predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

            if (filter.getCompanyId() != null) {
                predicates.add(criteriaBuilder.equal(root.get("company").get("id"), filter.getCompanyId()));
            }

            if (filter.getIsActive() != null) {
                predicates.add(criteriaBuilder.equal(root.get("isActive"), filter.getIsActive()));
            }

            if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
                String searchPattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                Predicate codePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("categoryCode")), searchPattern);
                Predicate namePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("categoryName")), searchPattern);
                predicates.add(criteriaBuilder.or(codePredicate, namePredicate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
