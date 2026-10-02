package com.erp.account.modules.ledger.specification;

import com.erp.account.modules.ledger.dto.request.ChartOfAccountFilterDto;
import com.erp.account.modules.ledger.entity.ChartOfAccount;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ChartOfAccountSpecification {

    private ChartOfAccountSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<ChartOfAccount> getFilterSpecification(ChartOfAccountFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Global search
            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate codeLike = cb.like(cb.lower(root.get("accountCode")), searchPattern);
                Predicate nameLike = cb.like(cb.lower(root.get("accountName")), searchPattern);
                Predicate typeLike = cb.like(cb.lower(root.get("accountType").as(String.class)), searchPattern);
                Predicate groupLike = cb.like(cb.lower(getJoin(root, "group").get("name")), searchPattern);
                Predicate parentCodeLike = cb.like(cb.lower(getJoin(root, "parentAccount", JoinType.LEFT).get("accountCode")), searchPattern);
                predicates.add(cb.or(codeLike, nameLike, typeLike, groupLike, parentCodeLike));
            }

            // Group Filters
            if (filter.getGroupId() != null) {
                predicates.add(cb.equal(root.get("group").get("id"), filter.getGroupId()));
            }
            if (StringUtils.hasText(filter.getGroupName())) {
                predicates.add(cb.like(cb.lower(getJoin(root, "group").get("name")), "%" + filter.getGroupName().trim().toLowerCase() + "%"));
            }

            // Parent Account Filters
            if (filter.getParentAccountId() != null) {
                predicates.add(cb.equal(getJoin(root, "parentAccount", JoinType.LEFT).get("id"), filter.getParentAccountId()));
            }
            if (StringUtils.hasText(filter.getParentAccountCode())) {
                predicates.add(cb.like(cb.lower(getJoin(root, "parentAccount", JoinType.LEFT).get("accountCode")), "%" + filter.getParentAccountCode().trim().toLowerCase() + "%"));
            }

            // Exact & Partial Matches
            if (StringUtils.hasText(filter.getAccountCode())) {
                predicates.add(cb.like(cb.lower(root.get("accountCode")), "%" + filter.getAccountCode().trim().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(filter.getAccountName())) {
                predicates.add(cb.like(cb.lower(root.get("accountName")), "%" + filter.getAccountName().trim().toLowerCase() + "%"));
            }

            // Enums & Category
            if (filter.getAccountTypes() != null && !filter.getAccountTypes().isEmpty()) {
                predicates.add(root.get("accountType").in(filter.getAccountTypes()));
            }
            if (StringUtils.hasText(filter.getCategoryCode())) {
                Join<Object, Object> groupJoin = getJoin(root, "group");
                Join<Object, Object> categoryJoin = getJoin(groupJoin, "category");
                predicates.add(cb.equal(categoryJoin.get("code"), filter.getCategoryCode().trim()));
            }
            if (filter.getCategoryCodes() != null && !filter.getCategoryCodes().isEmpty()) {
                Join<Object, Object> groupJoin = getJoin(root, "group");
                Join<Object, Object> categoryJoin = getJoin(groupJoin, "category");
                predicates.add(categoryJoin.get("code").in(filter.getCategoryCodes()));
            }
            if (StringUtils.hasText(filter.getGroupCode())) {
                Join<Object, Object> groupJoin = getJoin(root, "group");
                predicates.add(cb.equal(groupJoin.get("code"), filter.getGroupCode().trim()));
            }
            if (filter.getGroupCodes() != null && !filter.getGroupCodes().isEmpty()) {
                Join<Object, Object> groupJoin = getJoin(root, "group");
                predicates.add(groupJoin.get("code").in(filter.getGroupCodes()));
            }

            // Booleans
            if (filter.getPostingAllowed() != null) {
                predicates.add(cb.equal(root.get("postingAllowed"), filter.getPostingAllowed()));
            }
            if (filter.getIsActive() != null) {
                predicates.add(cb.equal(root.get("isActive"), filter.getIsActive()));
            }

            // Numeric Ranges
            if (filter.getMinOpeningBalance() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("openingBalance"), filter.getMinOpeningBalance()));
            }
            if (filter.getMaxOpeningBalance() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("openingBalance"), filter.getMaxOpeningBalance()));
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

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static Join<Object, Object> getJoin(From<?, ?> root, String attributeName) {
        Join<Object, Object> join = (Join<Object, Object>) root.join(attributeName);
        if (join == null) {
            join = (Join<Object, Object>) root.join(attributeName, JoinType.INNER);
        }
        return join;
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    private static Join<Object, Object> getJoin(From<?, ?> root, String attributeName, JoinType joinType) {
        Join<Object, Object> join = (Join<Object, Object>) root.join(attributeName, joinType);
        if (join == null) {
            join = (Join<Object, Object>) root.join(attributeName);
        }
        return join;
    }
}
