package com.erp.account.modules.gstslab.specification;

import com.erp.account.modules.gstslab.dto.request.GstSlabFilterDto;
import com.erp.account.modules.gstslab.entity.GstSlab;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class GstSlabSpecification {

    private GstSlabSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<GstSlab> getFilterSpecification(GstSlabFilterDto filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

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

            // Global search
            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("slabName")), searchPattern);
                predicates.add(nameLike);
            }

            // Exact & Partial Match
            if (StringUtils.hasText(filter.getSlabName())) {
                predicates.add(cb.like(cb.lower(root.get("slabName")), "%" + filter.getSlabName().trim().toLowerCase() + "%"));
            }

            // Total Rate Range (using igstRate as total)
            if (filter.getMinTotalRate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("igstRate"), filter.getMinTotalRate()));
            }
            if (filter.getMaxTotalRate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("igstRate"), filter.getMaxTotalRate()));
            }

            // Date Ranges
            if (filter.getEffectiveFromStart() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("effectiveFrom"), filter.getEffectiveFromStart()));
            }
            if (filter.getEffectiveFromEnd() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("effectiveFrom"), filter.getEffectiveFromEnd()));
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
