package com.erp.account.modules.accountingperiod.specification;

import com.erp.account.modules.accountingperiod.dto.request.AccountingPeriodFilterDto;
import com.erp.account.modules.accountingperiod.entity.AccountingPeriod;
import com.erp.account.security.CurrentUserContext;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class AccountingPeriodSpecification {

    private AccountingPeriodSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<AccountingPeriod> getFilterSpecification(AccountingPeriodFilterDto filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters
            if (!CurrentUserContext.isSystemAdmin()) {
                UUID companyId = CurrentUserContext.getCompanyId();
                if (companyId != null) {
                    predicates.add(cb.equal(root.get("company").get("id"), companyId));
                }
            }
            if (filter != null && filter.getFiscalYearId() != null) {
                predicates.add(cb.equal(root.get("fiscalYear").get("id"), filter.getFiscalYearId()));
            }

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Closed status
            if (filter.getIsClosed() != null) {
                predicates.add(cb.equal(root.get("isClosed"), filter.getIsClosed()));
            }

            // Global search
            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("periodName")), searchPattern);
                predicates.add(nameLike);
            }

            // Exact & Partial Match
            if (StringUtils.hasText(filter.getPeriodName())) {
                predicates.add(cb.like(cb.lower(root.get("periodName")), "%" + filter.getPeriodName().trim().toLowerCase() + "%"));
            }

            // Date Ranges
            if (filter.getStartDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startDate"), filter.getStartDateFrom()));
            }
            if (filter.getStartDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startDate"), filter.getStartDateTo()));
            }
            
            if (filter.getEndDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("endDate"), filter.getEndDateFrom()));
            }
            if (filter.getEndDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("endDate"), filter.getEndDateTo()));
            }

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
