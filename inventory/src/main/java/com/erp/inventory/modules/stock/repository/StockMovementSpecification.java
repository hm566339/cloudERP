package com.erp.inventory.modules.stock.repository;

import com.erp.inventory.modules.stock.dto.request.StockMovementFilterRequest;
import com.erp.inventory.modules.stock.entity.StockMovement;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class StockMovementSpecification {

    public static Specification<StockMovement> getFilterSpecification(StockMovementFilterRequest filter, UUID companyId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always enforce company isolation
            if (companyId != null) {
                predicates.add(criteriaBuilder.equal(root.get("companyId"), companyId));
            }

            // Exclude soft-deleted records if applicable
            predicates.add(criteriaBuilder.or(
                    criteriaBuilder.isNull(root.get("isDeleted")),
                    criteriaBuilder.isFalse(root.get("isDeleted"))
            ));

            if (filter != null) {
                // Status filtering (case-insensitive)
                if (StringUtils.hasText(filter.getStatus())) {
                    predicates.add(criteriaBuilder.equal(
                            criteriaBuilder.upper(root.get("status")),
                            filter.getStatus().trim().toUpperCase()
                    ));
                }

                // Movement Type (case-insensitive)
                if (StringUtils.hasText(filter.getMovementType())) {
                    predicates.add(criteriaBuilder.equal(
                            criteriaBuilder.upper(root.get("movementType")),
                            filter.getMovementType().trim().toUpperCase()
                    ));
                }

                // Reference Type
                if (filter.getReferenceType() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("referenceType"), filter.getReferenceType()));
                }

                // Reference ID
                if (filter.getReferenceId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("referenceId"), filter.getReferenceId()));
                }

                // Reference Number (case-insensitive)
                if (StringUtils.hasText(filter.getReferenceNumber())) {
                    predicates.add(criteriaBuilder.equal(
                            criteriaBuilder.lower(root.get("referenceNumber")),
                            filter.getReferenceNumber().trim().toLowerCase()
                    ));
                }

                // Movement Number
                if (StringUtils.hasText(filter.getMovementNo())) {
                    predicates.add(criteriaBuilder.equal(
                            criteriaBuilder.lower(root.get("movementNo")),
                            filter.getMovementNo().trim().toLowerCase()
                    ));
                }

                // Movement Date
                if (filter.getMovementDate() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("movementDate"), filter.getMovementDate()));
                }

                // Posted At
                if (filter.getPostedAt() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("postedAt"), filter.getPostedAt()));
                }

                // Posted By
                if (filter.getPostedBy() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("postedBy"), filter.getPostedBy()));
                }

                // Reversed Movement ID
                if (filter.getReversedMovementId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("reversedMovementId"), filter.getReversedMovementId()));
                }

                // Date ranges
                if (filter.getCreatedFrom() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), filter.getCreatedFrom()));
                }
                if (filter.getCreatedTo() != null) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), filter.getCreatedTo()));
                }

                if (filter.getUpdatedFrom() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("updatedAt"), filter.getUpdatedFrom()));
                }
                if (filter.getUpdatedTo() != null) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("updatedAt"), filter.getUpdatedTo()));
                }

                // IDs filter
                if (filter.getIds() != null && !filter.getIds().isEmpty()) {
                    predicates.add(root.get("id").in(filter.getIds()));
                }

                // Search key across movementNo, referenceNumber, remarks
                if (StringUtils.hasText(filter.getSearchKey())) {
                    String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                    predicates.add(criteriaBuilder.or(
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("movementNo")), searchPattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("referenceNumber")), searchPattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("remarks")), searchPattern)
                    ));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
