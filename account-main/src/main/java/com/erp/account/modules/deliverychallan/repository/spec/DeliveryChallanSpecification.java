package com.erp.account.modules.deliverychallan.repository.spec;

import com.erp.account.modules.deliverychallan.entity.DeliveryChallan;
import com.erp.account.modules.deliverychallan.entity.DeliveryChallanStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.UUID;

public class DeliveryChallanSpecification {

    public static Specification<DeliveryChallan> filter(UUID companyId, DeliveryChallanStatus status, UUID customerId, LocalDate fromDate, LocalDate toDate, String search) {
        return (root, query, cb) -> {
            var predicates = cb.conjunction();
            
            predicates.getExpressions().add(cb.equal(root.get("companyId"), companyId));
            predicates.getExpressions().add(cb.equal(root.get("isDeleted"), false));

            if (status != null) {
                predicates.getExpressions().add(cb.equal(root.get("status"), status));
            }
            if (customerId != null) {
                predicates.getExpressions().add(cb.equal(root.get("customerId"), customerId));
            }
            if (fromDate != null) {
                predicates.getExpressions().add(cb.greaterThanOrEqualTo(root.get("dcDate"), fromDate));
            }
            if (toDate != null) {
                predicates.getExpressions().add(cb.lessThanOrEqualTo(root.get("dcDate"), toDate));
            }
            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                predicates.getExpressions().add(cb.or(
                        cb.like(cb.lower(root.get("dcNumber")), searchPattern),
                        cb.like(cb.lower(root.join("customer").get("customerName")), searchPattern)
                ));
            }
            return predicates;
        };
    }
}
