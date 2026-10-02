package com.erp.account.modules.salesorder.repository.spec;

import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.salesorder.entity.SalesOrder;
import com.erp.account.modules.salesorder.entity.SalesOrderStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class SalesOrderSpecification {

    public static Specification<SalesOrder> getSalesOrderSpec(
            UUID companyId,
            SalesOrderStatus status,
            UUID customerId,
            LocalDate fromDate,
            LocalDate toDate,
            String search
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Always filter by companyId and isDeleted
            predicates.add(cb.equal(root.get("companyId"), companyId));
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (customerId != null) {
                predicates.add(cb.equal(root.get("customerId"), customerId));
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("soDate"), fromDate));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("soDate"), toDate));
            }

            if (StringUtils.isNotBlank(search)) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                Join<SalesOrder, Customer> customerJoin = root.join("customer", JoinType.LEFT);
                
                Predicate soNumberPredicate = cb.like(cb.lower(root.get("soNumber")), searchPattern);
                Predicate customerNamePredicate = cb.like(cb.lower(customerJoin.get("customerName")), searchPattern);
                
                predicates.add(cb.or(soNumberPredicate, customerNamePredicate));
            }

            // To avoid N+1 issues when fetching customers for the list response
            if (Long.class != query.getResultType() && long.class != query.getResultType()) {
                root.fetch("customer", JoinType.LEFT);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
