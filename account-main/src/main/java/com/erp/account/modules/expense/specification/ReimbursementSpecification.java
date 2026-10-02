package com.erp.account.modules.expense.specification;

import com.erp.account.modules.expense.dto.ReimbursementFilterRequest;
import com.erp.account.modules.expense.entity.Reimbursement;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ReimbursementSpecification {

    private ReimbursementSpecification() {
    }

    public static Specification<Reimbursement> getFilterSpecification(ReimbursementFilterRequest filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("company").get("id"), companyId));
            predicates.add(cb.equal(root.get("isDeleted"), false));

            if (filter != null) {
                if (filter.getReimbursementNo() != null && !filter.getReimbursementNo().trim().isEmpty()) {
                    predicates.add(cb.like(cb.lower(root.get("reimbursementNo")), "%" + filter.getReimbursementNo().toLowerCase() + "%"));
                }
                if (filter.getEmployeeId() != null) {
                    predicates.add(cb.equal(root.get("employeeId"), filter.getEmployeeId()));
                }
                if (filter.getExpenseClaimId() != null) {
                    predicates.add(cb.equal(root.get("expenseClaimId"), filter.getExpenseClaimId()));
                }
                if (filter.getStatus() != null) {
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }
                if (filter.getPaymentMethod() != null) {
                    predicates.add(cb.equal(root.get("paymentMethod"), filter.getPaymentMethod()));
                }
                if (filter.getFromDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(root.get("reimbursementDate"), filter.getFromDate()));
                }
                if (filter.getToDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(root.get("reimbursementDate"), filter.getToDate()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
