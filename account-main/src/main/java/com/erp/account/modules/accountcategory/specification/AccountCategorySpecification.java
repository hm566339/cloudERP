package com.erp.account.modules.accountcategory.specification;

import com.erp.account.modules.accountcategory.dto.request.AccountCategoryFilterDto;
import com.erp.account.modules.accountcategory.entity.AccountCategory;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class AccountCategorySpecification {

    private AccountCategorySpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<AccountCategory> getFilterSpecification(AccountCategoryFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (filter == null) {
                predicates.add(cb.isFalse(root.get("isDeleted")));
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Deleted status
            if (filter.getIsDeleted() != null) {
                predicates.add(cb.equal(root.get("isDeleted"), filter.getIsDeleted()));
            } else {
                predicates.add(cb.isFalse(root.get("isDeleted")));
            }

            // Global search
            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), searchPattern);
                predicates.add(nameLike);
            }

            // Exact & Partial Match
            if (StringUtils.hasText(filter.getName())) {
                predicates.add(cb.like(cb.lower(root.get("name")), "%" + filter.getName().trim().toLowerCase() + "%"));
            }

            // Enums
            if (filter.getCodes() != null && !filter.getCodes().isEmpty()) {
                predicates.add(root.get("code").in(filter.getCodes()));
            }
            if (filter.getNatures() != null && !filter.getNatures().isEmpty()) {
                predicates.add(root.get("nature").in(filter.getNatures()));
            }

            // Date Ranges
            if (filter.getCreatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt").as(java.time.LocalDate.class), filter.getCreatedFrom()));
            }
            if (filter.getCreatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt").as(java.time.LocalDate.class), filter.getCreatedTo()));
            }
            if (filter.getUpdatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt").as(java.time.LocalDate.class), filter.getUpdatedFrom()));
            }
            if (filter.getUpdatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("updatedAt").as(java.time.LocalDate.class), filter.getUpdatedTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
