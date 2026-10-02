package com.erp.inventory.modules.product.repository;

import com.erp.inventory.modules.product.entity.Product;
import com.erp.inventory.modules.product.dto.request.ProductFilterRequest;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> getSpecification(ProductFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getCompanyId() != null) {
                predicates.add(cb.equal(root.get("companyId"), filter.getCompanyId()));
            }

            if (filter.getSearchKey() != null && !filter.getSearchKey().trim().isEmpty()) {
                String likePattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate codePredicate = cb.like(cb.lower(root.get("productCode")), likePattern);
                Predicate skuPredicate = cb.like(cb.lower(root.get("sku")), likePattern);
                Predicate namePredicate = cb.like(cb.lower(root.get("productName")), likePattern);
                predicates.add(cb.or(codePredicate, skuPredicate, namePredicate));
            }

            if (filter.getProductCode() != null && !filter.getProductCode().trim().isEmpty()) {
                predicates.add(cb.equal(root.get("productCode"), filter.getProductCode().trim()));
            }

            if (filter.getSku() != null && !filter.getSku().trim().isEmpty()) {
                predicates.add(cb.equal(root.get("sku"), filter.getSku().trim()));
            }

            if (filter.getProductName() != null && !filter.getProductName().trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("productName")), "%" + filter.getProductName().trim().toLowerCase() + "%"));
            }

            if (filter.getStatus() != null && !filter.getStatus().trim().isEmpty()) {
                try {
                    com.erp.inventory.modules.product.enums.ProductStatus statusEnum = com.erp.inventory.modules.product.enums.ProductStatus.valueOf(filter.getStatus().trim().toUpperCase());
                    predicates.add(cb.equal(root.get("status"), statusEnum));
                } catch (IllegalArgumentException e) {
                    // Ignore invalid status for filtering
                }
            }

            if (filter.getTrackingType() != null) {
                predicates.add(cb.equal(root.get("trackingType"), filter.getTrackingType()));
            }

            if (filter.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("categoryId"), filter.getCategoryId()));
            }

            if (filter.getBaseUomId() != null) {
                predicates.add(cb.equal(root.get("baseUomId"), filter.getBaseUomId()));
            }

            if (filter.getProductType() != null) {
                predicates.add(cb.equal(root.get("productType"), filter.getProductType()));
            }

            if (filter.getCreatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getCreatedFrom()));
            }

            if (filter.getCreatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getCreatedTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
