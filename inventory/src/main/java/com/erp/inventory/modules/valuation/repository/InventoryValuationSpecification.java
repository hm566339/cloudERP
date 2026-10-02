package com.erp.inventory.modules.valuation.repository;

import com.erp.inventory.modules.valuation.dto.request.InventoryValuationFilterRequest;
import com.erp.inventory.modules.valuation.entity.InventoryValuation;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class InventoryValuationSpecification {

    public static Specification<InventoryValuation> getFilterSpecification(InventoryValuationFilterRequest filter, UUID companyId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(criteriaBuilder.equal(root.get("companyId"), companyId));
            }

            predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

            if (filter != null) {
                if (filter.getProductId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("productId"), filter.getProductId()));
                }

                if (filter.getWarehouseId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("warehouseId"), filter.getWarehouseId()));
                }
                
                if (filter.getLocationId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("locationId"), filter.getLocationId()));
                }

                if (filter.getStockMovementId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("stockMovementId"), filter.getStockMovementId()));
                }
                
                if (filter.getValuationDate() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("valuationDate"), filter.getValuationDate()));
                }
                
                if (filter.getGlPosted() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("glPosted"), filter.getGlPosted()));
                }
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
