package com.erp.inventory.modules.pricing.repository;

import com.erp.inventory.modules.pricing.dto.request.ProductPriceFilterRequest;
import com.erp.inventory.modules.pricing.entity.ProductPrice;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;

public class ProductPriceSpecification {

    public static Specification<ProductPrice> withFilter(ProductPriceFilterRequest filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (filter.getCompanyId() != null) {
                predicates.add(cb.equal(root.get("companyId"), filter.getCompanyId()));
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

            if (filter.getPriceType() != null) {
                predicates.add(cb.equal(root.get("priceType"), filter.getPriceType()));
            }

            if (filter.getPrice() != null) {
                predicates.add(cb.equal(root.get("price"), filter.getPrice()));
            }

            if (StringUtils.hasText(filter.getCurrencyCode())) {
                predicates.add(cb.equal(root.get("currencyCode"), filter.getCurrencyCode()));
            }

            if (filter.getMinQuantity() != null) {
                predicates.add(cb.equal(root.get("minQuantity"), filter.getMinQuantity()));
            }

            if (filter.getEffectiveFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("effectiveFrom"), filter.getEffectiveFrom()));
            }

            if (filter.getEffectiveTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("effectiveTo"), filter.getEffectiveTo()));
            }

            if (StringUtils.hasText(filter.getStatus())) {
                predicates.add(cb.equal(root.get("status"), filter.getStatus()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
