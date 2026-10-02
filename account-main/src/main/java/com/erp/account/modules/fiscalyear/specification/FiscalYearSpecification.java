package com.erp.account.modules.fiscalyear.specification;

import com.erp.account.modules.fiscalyear.dto.request.FiscalYearFilterDto;
import com.erp.account.modules.fiscalyear.entity.FiscalYear;
import com.erp.account.modules.fiscalyear.enums.FiscalYearStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class FiscalYearSpecification {

    private FiscalYearSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<FiscalYear> getFilterSpecification(FiscalYearFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Closed status
            if (filter.getIsClosed() != null) {
                if (filter.getIsClosed()) {
                    predicates.add(cb.or(
                            cb.equal(root.get("status"), FiscalYearStatus.CLOSED),
                            cb.equal(root.get("status"), FiscalYearStatus.LOCKED)
                    ));
                } else {
                    predicates.add(cb.equal(root.get("status"), FiscalYearStatus.OPEN));
                }
            }

            // Global search
            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("fiscalYear")), searchPattern);
                predicates.add(nameLike);
            }

            // Exact & Partial Match
            if (StringUtils.hasText(filter.getFiscalYearName())) {
                predicates.add(cb.like(cb.lower(root.get("fiscalYear")), "%" + filter.getFiscalYearName().trim().toLowerCase() + "%"));
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
