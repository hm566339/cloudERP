package com.erp.inventory.modules.warehouse.repository;

import com.erp.inventory.modules.warehouse.entity.Warehouse;
import com.erp.inventory.modules.warehouse.dto.request.WarehouseFilterRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class WarehouseSpecification {

    public static Specification<Warehouse> withFilter(WarehouseFilterRequest filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("companyId"), companyId));

            if (filter != null) {
                if (StringUtils.hasText(filter.getWarehouseCode())) {
                    predicates.add(cb.like(cb.lower(root.get("warehouseCode")), "%" + filter.getWarehouseCode().toLowerCase() + "%"));
                }
                if (StringUtils.hasText(filter.getWarehouseName())) {
                    predicates.add(cb.like(cb.lower(root.get("warehouseName")), "%" + filter.getWarehouseName().toLowerCase() + "%"));
                }
                if (filter.getWarehouseType() != null) {
                    predicates.add(cb.equal(root.get("warehouseType"), filter.getWarehouseType()));
                }
                if (StringUtils.hasText(filter.getStatus())) {
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
