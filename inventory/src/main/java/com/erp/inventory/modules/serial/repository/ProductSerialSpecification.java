package com.erp.inventory.modules.serial.repository;

import com.erp.inventory.modules.serial.dto.request.ProductSerialFilterRequest;
import com.erp.inventory.modules.serial.entity.ProductSerial;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class ProductSerialSpecification {

    public static Specification<ProductSerial> withFilter(ProductSerialFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getCompanyId() != null) {
                predicates.add(cb.equal(root.get("companyId"), filter.getCompanyId()));
            }

            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("serialNumber")), searchPattern));
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

            if (filter.getBatchId() != null) {
                predicates.add(cb.equal(root.get("batchId"), filter.getBatchId()));
            }

            if (StringUtils.hasText(filter.getSerialNumber())) {
                predicates.add(cb.equal(root.get("serialNumber"), filter.getSerialNumber()));
            }

            if (filter.getPurchaseDate() != null) {
                predicates.add(cb.equal(root.get("purchaseDate"), filter.getPurchaseDate()));
            }

            if (filter.getWarrantyStartDate() != null) {
                predicates.add(cb.equal(root.get("warrantyStartDate"), filter.getWarrantyStartDate()));
            }

            if (filter.getWarrantyEndDate() != null) {
                predicates.add(cb.equal(root.get("warrantyEndDate"), filter.getWarrantyEndDate()));
            }

            if (StringUtils.hasText(filter.getStatus())) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
