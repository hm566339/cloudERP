package com.erp.inventory.modules.adjustment.repository;

import com.erp.inventory.modules.adjustment.dto.request.StockAdjustmentFilterRequest;
import com.erp.inventory.modules.adjustment.entity.StockAdjustment;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class StockAdjustmentSpecification {

    public static Specification<StockAdjustment> getFilterSpecification(StockAdjustmentFilterRequest filter, UUID companyId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter by company ID
            if (companyId != null) {
                predicates.add(criteriaBuilder.equal(root.get("companyId"), companyId));
            }

            // Exclude deleted records if applicable
            predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

            if (filter != null) {
                if (filter.getSearchKey() != null && !filter.getSearchKey().trim().isEmpty()) {
                    String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                    predicates.add(criteriaBuilder.or(
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("adjustmentNo")), searchPattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("reason")), searchPattern),
                            criteriaBuilder.like(criteriaBuilder.lower(root.get("remarks")), searchPattern)
                    ));
                }

                if (filter.getAdjustmentNo() != null && !filter.getAdjustmentNo().trim().isEmpty()) {
                    predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("adjustmentNo")), "%" + filter.getAdjustmentNo().trim().toLowerCase() + "%"));
                }

                if (filter.getStatus() != null && !filter.getStatus().trim().isEmpty()) {
                    predicates.add(criteriaBuilder.equal(root.get("status"), filter.getStatus().trim()));
                }

                if (filter.getWarehouseId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("warehouseId"), filter.getWarehouseId()));
                }

                if (filter.getLocationId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("locationId"), filter.getLocationId()));
                }

                if (filter.getCreatedFrom() != null) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("createdAt"), filter.getCreatedFrom()));
                }

                if (filter.getCreatedTo() != null) {
                    predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("createdAt"), filter.getCreatedTo()));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
