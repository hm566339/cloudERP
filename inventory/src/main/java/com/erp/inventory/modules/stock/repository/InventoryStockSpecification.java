package com.erp.inventory.modules.stock.repository;

import com.erp.inventory.modules.stock.dto.request.InventoryStockFilterRequest;
import com.erp.inventory.modules.stock.entity.InventoryStock;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class InventoryStockSpecification {

    public static Specification<InventoryStock> getFilterSpecification(InventoryStockFilterRequest filter, UUID companyId) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always enforce company isolation
            predicates.add(criteriaBuilder.equal(root.get("companyId"), companyId));

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
                if (filter.getBatchId() != null) {
                    predicates.add(criteriaBuilder.equal(root.get("batchId"), filter.getBatchId()));
                }
                if (filter.getIds() != null && !filter.getIds().isEmpty()) {
                    predicates.add(root.get("id").in(filter.getIds()));
                }
                
                if (StringUtils.hasText(filter.getSearchKey())) {
                    String searchStr = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                    jakarta.persistence.criteria.Join<Object, Object> productJoin = root.join("product", jakarta.persistence.criteria.JoinType.LEFT);
                    jakarta.persistence.criteria.Join<Object, Object> warehouseJoin = root.join("warehouse", jakarta.persistence.criteria.JoinType.LEFT);
                    
                    Predicate productSearch = criteriaBuilder.like(criteriaBuilder.lower(productJoin.get("productName")), searchStr);
                    Predicate warehouseSearch = criteriaBuilder.like(criteriaBuilder.lower(warehouseJoin.get("warehouseName")), searchStr);
                    
                    predicates.add(criteriaBuilder.or(productSearch, warehouseSearch));
                }
                
                // Add non-deleted condition if applicable (inherited from BaseEntity)
                predicates.add(criteriaBuilder.equal(root.get("isDeleted"), false));
            }

            // Optimization: Apply FETCH JOIN only for the data retrieval query, NOT for the count query
            // This prevents pagination issues where COUNT queries cannot contain FETCH
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("product", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("warehouse", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("location", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("batch", jakarta.persistence.criteria.JoinType.LEFT);
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
