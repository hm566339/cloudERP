package com.erp.account.modules.purchaseorder.repository.spec;

import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrderStatus;
import com.erp.account.modules.vendor.entity.Vendor;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class PurchaseOrderSpecification {

    public static Specification<PurchaseOrder> getPurchaseOrderSpec(
            UUID companyId,
            PurchaseOrderStatus status,
            UUID vendorId,
            LocalDate fromDate,
            LocalDate toDate,
            String search
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("companyId"), companyId));
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (vendorId != null) {
                predicates.add(cb.equal(root.get("vendorId"), vendorId));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("poDate"), fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("poDate"), toDate));
            }

            if (StringUtils.isNotBlank(search)) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Join<PurchaseOrder, Vendor> vendorJoin = root.join("vendor", JoinType.LEFT);

                Predicate poNumberPredicate = cb.like(cb.lower(root.get("poNumber")), searchPattern);
                Predicate vendorNamePredicate = cb.like(cb.lower(vendorJoin.get("vendorName")), searchPattern);

                predicates.add(cb.or(poNumberPredicate, vendorNamePredicate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
