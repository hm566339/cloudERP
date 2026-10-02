package com.erp.inventory.modules.warehouse.repository;

import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.entity.WarehouseLocation;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseLocationFilterRequest;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import com.erp.inventory.modules.warehouse.entity.Warehouse;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class WarehouseLocationSpecification {

    public static Specification<WarehouseLocation> withFilter(WarehouseLocationFilterRequest filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("companyId"), companyId));

            if (filter != null) {
                if (filter.getWarehouseId() != null) {
                    Join<WarehouseLocation, Warehouse> warehouseJoin = root.join("warehouse", JoinType.INNER);

                    predicates.add(
                            cb.equal(warehouseJoin.get("id"), filter.getWarehouseId()));
                }
                if (filter.getParentLocationId() != null) {
                    predicates.add(cb.equal(root.get("parentLocationId"), filter.getParentLocationId()));
                }
                if (StringUtils.hasText(filter.getLocationCode())) {
                    predicates.add(cb.like(cb.lower(root.get("locationCode")),
                            "%" + filter.getLocationCode().toLowerCase() + "%"));
                }
                if (StringUtils.hasText(filter.getLocationName())) {
                    predicates.add(cb.like(cb.lower(root.get("locationName")),
                            "%" + filter.getLocationName().toLowerCase() + "%"));
                }
                if (filter.getIsActive() != null) {
                    predicates.add(cb.equal(root.get("isActive"), filter.getIsActive()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
