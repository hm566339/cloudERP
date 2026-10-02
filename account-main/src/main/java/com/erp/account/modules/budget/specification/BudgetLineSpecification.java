package com.erp.account.modules.budget.specification;

import com.erp.account.modules.budget.dto.request.BudgetLineFilterDto;
import com.erp.account.modules.budget.entity.BudgetLine;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class BudgetLineSpecification {

    private BudgetLineSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<BudgetLine> hasCompanyId(UUID companyId) {
        return (root, query, cb) -> cb.equal(root.get("company").get("id"), companyId);
    }

    public static Specification<BudgetLine> hasBudgetHeaderId(UUID budgetHeaderId) {
        return (root, query, cb) -> cb.equal(root.get("budgetHeader").get("id"), budgetHeaderId);
    }

    public static Specification<BudgetLine> hasAccountId(UUID accountId) {
        return (root, query, cb) -> cb.equal(root.get("account").get("id"), accountId);
    }

    public static Specification<BudgetLine> hasDepartmentId(UUID departmentId) {
        return (root, query, cb) -> cb.equal(root.get("departmentId"), departmentId);
    }

    public static Specification<BudgetLine> hasFiscalYearId(UUID fiscalYearId) {
        return (root, query, cb) -> cb.equal(root.get("budgetHeader").get("fiscalYear").get("id"), fiscalYearId);
    }

    public static Specification<BudgetLine> allocatedAmountBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min == null && max == null) {
                return null;
            }
            Expression<BigDecimal> value = root.get("allocatedAmount");
            if (min != null && max != null) {
                return cb.between(value, min, max);
            }
            if (min != null) {
                return cb.greaterThanOrEqualTo(value, min);
            }
            return cb.lessThanOrEqualTo(value, max);
        };
    }

    public static Specification<BudgetLine> utilizedAmountBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min == null && max == null) {
                return null;
            }
            Expression<BigDecimal> value = root.get("utilizedAmount");
            if (min != null && max != null) {
                return cb.between(value, min, max);
            }
            if (min != null) {
                return cb.greaterThanOrEqualTo(value, min);
            }
            return cb.lessThanOrEqualTo(value, max);
        };
    }

    public static Specification<BudgetLine> remainingAmountBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min == null && max == null) {
                return null;
            }
            Expression<BigDecimal> allocated = cb.coalesce(root.get("allocatedAmount"), cb.literal(BigDecimal.ZERO));
            Expression<BigDecimal> utilized = cb.coalesce(root.get("utilizedAmount"), cb.literal(BigDecimal.ZERO));
            Expression<BigDecimal> remaining = cb.diff(allocated, utilized);
            if (min != null && max != null) {
                return cb.between(remaining, min, max);
            }
            if (min != null) {
                return cb.greaterThanOrEqualTo(remaining, min);
            }
            return cb.lessThanOrEqualTo(remaining, max);
        };
    }

    public static Specification<BudgetLine> createdDateBetween(LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) {
            return null;
        }
        return (root, query, cb) -> cb.between(root.get("createdAt"), startDate.atStartOfDay(), endDate.atTime(23, 59, 59));
    }

    public static Specification<BudgetLine> containsHeaderOrAccount(String search) {
        return (root, query, cb) -> {
            String likePattern = "%" + search.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("budgetHeader").get("budgetName")), likePattern),
                    cb.like(cb.lower(root.get("account").get("accountName")), likePattern),
                    cb.like(cb.lower(root.get("account").get("accountCode")), likePattern)
            );
        };
    }

    public static Specification<BudgetLine> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("isDeleted"));
    }

    public static Specification<BudgetLine> getFilterSpecification(BudgetLineFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (filter == null) {
                predicates.add(cb.isFalse(root.get("isDeleted")));
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            if (filter.getIsDeleted() != null) {
                predicates.add(cb.equal(root.get("isDeleted"), filter.getIsDeleted()));
            } else {
                predicates.add(cb.isFalse(root.get("isDeleted")));
            }

            if (filter.getBudgetHeaderId() != null) {
                predicates.add(cb.equal(root.get("budgetHeader").get("id"), filter.getBudgetHeaderId()));
            }

            if (filter.getAccountId() != null) {
                predicates.add(cb.equal(root.get("account").get("id"), filter.getAccountId()));
            }

            if (filter.getDepartmentId() != null) {
                predicates.add(cb.equal(root.get("departmentId"), filter.getDepartmentId()));
            }

            if (filter.getFiscalYearId() != null) {
                predicates.add(cb.equal(root.get("budgetHeader").get("fiscalYear").get("id"), filter.getFiscalYearId()));
            }

            Expression<BigDecimal> allocated = root.get("allocatedAmount");
            if (filter.getMinAllocatedAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(allocated, filter.getMinAllocatedAmount()));
            }
            if (filter.getMaxAllocatedAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(allocated, filter.getMaxAllocatedAmount()));
            }

            Expression<BigDecimal> utilized = root.get("utilizedAmount");
            if (filter.getMinUtilizedAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(utilized, filter.getMinUtilizedAmount()));
            }
            if (filter.getMaxUtilizedAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(utilized, filter.getMaxUtilizedAmount()));
            }

            if (filter.getMinRemainingAmount() != null || filter.getMaxRemainingAmount() != null) {
                Expression<BigDecimal> alloc = cb.coalesce(root.get("allocatedAmount"), cb.literal(BigDecimal.ZERO));
                Expression<BigDecimal> util = cb.coalesce(root.get("utilizedAmount"), cb.literal(BigDecimal.ZERO));
                Expression<BigDecimal> remaining = cb.diff(alloc, util);

                if (filter.getMinRemainingAmount() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(remaining, filter.getMinRemainingAmount()));
                }
                if (filter.getMaxRemainingAmount() != null) {
                    predicates.add(cb.lessThanOrEqualTo(remaining, filter.getMaxRemainingAmount()));
                }
            }

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("budgetHeader").get("fiscalYear").get("startDate"), filter.getFromDate()));
            }
            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("budgetHeader").get("fiscalYear").get("endDate"), filter.getToDate()));
            }

            if (StringUtils.hasText(filter.getSearchKeyword())) {
                String pattern = "%" + filter.getSearchKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("budgetHeader").get("budgetName")), pattern),
                        cb.like(cb.lower(root.get("account").get("accountName")), pattern),
                        cb.like(cb.lower(root.get("account").get("accountCode")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
