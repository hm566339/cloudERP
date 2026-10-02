package com.erp.account.modules.goodsreceipt.repository.spec;

import com.erp.account.modules.goodsreceipt.entity.GoodsReceipt;
import com.erp.account.modules.goodsreceipt.entity.GoodsReceiptStatus;
import com.erp.account.modules.purchaseorder.entity.PurchaseOrder;
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

public class GoodsReceiptSpecification {

    public static Specification<GoodsReceipt> getGoodsReceiptSpec(
            UUID companyId,
            GoodsReceiptStatus status,
            UUID purchaseOrderId,
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

            if (purchaseOrderId != null) {
                predicates.add(cb.equal(root.get("purchaseOrderId"), purchaseOrderId));
            }

            if (vendorId != null) {
                predicates.add(cb.equal(root.get("vendorId"), vendorId));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("grnDate"), fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("grnDate"), toDate));
            }

            if (StringUtils.isNotBlank(search)) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Join<GoodsReceipt, Vendor> vendorJoin = root.join("vendor", JoinType.LEFT);
                Join<GoodsReceipt, PurchaseOrder> poJoin = root.join("purchaseOrder", JoinType.LEFT);

                Predicate grnNumberPredicate = cb.like(cb.lower(root.get("grnNumber")), searchPattern);
                Predicate vendorNamePredicate = cb.like(cb.lower(vendorJoin.get("vendorName")), searchPattern);
                Predicate poNumberPredicate = cb.like(cb.lower(poJoin.get("poNumber")), searchPattern);

                predicates.add(cb.or(grnNumberPredicate, vendorNamePredicate, poNumberPredicate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
