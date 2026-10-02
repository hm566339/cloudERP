package com.erp.account.modules.expense.specification;

import com.erp.account.enums.ApprovalStatus;
import com.erp.account.enums.ExpenseRequestStatus;
import com.erp.account.modules.expense.dto.ExpenseRequestFilterDto;
import com.erp.account.modules.expense.entity.ExpenseClaim;
import com.erp.account.modules.expense.entity.ExpenseRequest;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ExpenseRequestSpecification {

    private ExpenseRequestSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<ExpenseRequest> getFilterSpecification(ExpenseRequestFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            predicates.add(cb.or(
                    cb.isNull(root.get("isDeleted")),
                    cb.isFalse(root.get("isDeleted"))
            ));

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
                String searchPattern = "%" + filter.getSearch().trim().toLowerCase() + "%";
                Predicate reqNoLike = cb.like(cb.lower(root.get("requestNumber")), searchPattern);
                Predicate descLike = cb.like(cb.lower(root.get("purposeDescription")), searchPattern);
                Predicate vehLike = cb.like(cb.lower(root.get("vehicleNumber")), searchPattern);
                predicates.add(cb.or(reqNoLike, descLike, vehLike));
            }

            // Handle approval & expense availability filtering
            boolean filterByApprovedAvailable = Boolean.TRUE.equals(filter.getAvailableForExpense())
                    || filter.getApprovalStatus() == ExpenseRequestStatus.APPROVED
                    || (filter.getStatus() == ExpenseRequestStatus.APPROVED && filter.getApprovalStatus() == null);

            if (filterByApprovedAvailable) {
                predicates.add(cb.equal(root.get("approvalStatus"), ExpenseRequestStatus.APPROVED));
                predicates.add(root.get("status").in(ExpenseRequestStatus.APPROVED, ExpenseRequestStatus.CONVERTED_TO_EXPENSE));

                Expression<BigDecimal> effectiveApprovedAmount = cb.coalesce(root.get("approvedAmount"), root.get("requestedAmount"));
                predicates.add(cb.greaterThan(effectiveApprovedAmount, BigDecimal.ZERO));

                Subquery<BigDecimal> claimSumSubquery = query.subquery(BigDecimal.class);
                Root<ExpenseClaim> claimRoot = claimSumSubquery.from(ExpenseClaim.class);
                claimSumSubquery.select(cb.coalesce(cb.sum(claimRoot.get("claimAmount")), BigDecimal.ZERO));
                claimSumSubquery.where(
                        cb.equal(claimRoot.get("expenseRequestId"), root.get("id")),
                        cb.or(cb.isNull(claimRoot.get("isDeleted")), cb.isFalse(claimRoot.get("isDeleted"))),
                        cb.or(
                                cb.isNull(claimRoot.get("status")),
                                claimRoot.get("status").in(ApprovalStatus.REJECTED, ApprovalStatus.CANCELLED).not()
                        )
                );

                predicates.add(cb.greaterThan(effectiveApprovedAmount, claimSumSubquery));
            } else {
                if (filter.getApprovalStatus() != null) {
                    predicates.add(cb.equal(root.get("approvalStatus"), filter.getApprovalStatus()));
                }
                if (filter.getStatus() != null) {
                    predicates.add(cb.equal(root.get("status"), filter.getStatus()));
                }
            }

            if (filter.getRequestType() != null) {
                predicates.add(cb.equal(root.get("requestType"), filter.getRequestType()));
            }

            if (filter.getRoleType() != null) {
                predicates.add(cb.equal(root.get("roleType"), filter.getRoleType()));
            }

            if (filter.getEmployeeDriverId() != null) {
                predicates.add(cb.equal(root.get("employeeDriverId"), filter.getEmployeeDriverId()));
            }

            if (filter.getCategoryId() != null) {
                predicates.add(cb.equal(root.get("expenseCategory").get("id"), filter.getCategoryId()));
            }

            if (filter.getDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("requestDate"), filter.getDateFrom()));
            }

            if (filter.getDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("requestDate"), filter.getDateTo()));
            }

            if (filter.getSalesOrderId() != null) {
                predicates.add(cb.equal(root.get("salesOrderId"), filter.getSalesOrderId()));
            }

            if (filter.getDeliveryChallanId() != null) {
                predicates.add(cb.equal(root.get("deliveryChallanId"), filter.getDeliveryChallanId()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
