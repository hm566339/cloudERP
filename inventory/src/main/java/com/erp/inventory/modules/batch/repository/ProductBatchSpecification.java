package com.erp.inventory.modules.batch.repository;

import com.erp.inventory.modules.batch.dto.request.ProductBatchFilterRequest;
import com.erp.inventory.modules.batch.entity.ProductBatch;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class ProductBatchSpecification {

    public static Specification<ProductBatch> withFilter(ProductBatchFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getCompanyId() != null) {
                predicates.add(cb.equal(root.get("companyId"), filter.getCompanyId()));
            }

            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("batchNumber")), searchPattern));
            }

            if (filter.getCreatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getCreatedFrom()));
            }
            if (filter.getCreatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getCreatedTo()));
            }

            if (filter.getUpdatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), filter.getUpdatedFrom()));
            }
            if (filter.getUpdatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("updatedAt"), filter.getUpdatedTo()));
            }

            if (filter.getIds() != null && !filter.getIds().isEmpty()) {
                predicates.add(root.get("id").in(filter.getIds()));
            }

            if (filter.getProductId() != null) {
                predicates.add(cb.equal(root.get("productId"), filter.getProductId()));
            }

            if (StringUtils.hasText(filter.getBatchNumber())) {
                predicates.add(cb.equal(root.get("batchNumber"), filter.getBatchNumber()));
            }

            if (filter.getManufacturingDate() != null) {
                predicates.add(cb.equal(root.get("manufacturingDate"), filter.getManufacturingDate()));
            }

            if (filter.getExpiryDate() != null) {
                predicates.add(cb.equal(root.get("expiryDate"), filter.getExpiryDate()));
            }

            if (filter.getSupplierId() != null) {
                predicates.add(cb.equal(root.get("supplierId"), filter.getSupplierId()));
            }

            if (StringUtils.hasText(filter.getStatus())) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
