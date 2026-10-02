package com.erp.account.modules.banktransaction.specification;

import com.erp.account.enums.BankTransactionType;
import com.erp.account.modules.banktransaction.dto.request.BankTransactionFilterDto;
import com.erp.account.modules.banktransaction.entity.BankTransaction;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Specifications for advanced filtering of BankTransaction queries
 * 
 * Provides reusable Specification builders for complex queries.
 * 
 * @author ERP System
 * @version 1.0
 */
public class BankTransactionSpecification {

    private BankTransactionSpecification() {
        throw new UnsupportedOperationException("Specification is a utility class");
    }

    /**
     * Filter by company ID
     * 
     * @param companyId the company ID
     * @return specification
     */
    public static Specification<BankTransaction> hasCompanyId(UUID companyId) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.equal(root.get("company").get("id"), companyId);
    }

    /**
     * Filter by bank account ID
     * 
     * @param bankAccountId the bank account ID
     * @return specification
     */
    public static Specification<BankTransaction> hasBankAccountId(UUID bankAccountId) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.equal(root.get("bankAccount").get("id"), bankAccountId);
    }

    /**
     * Filter by transaction type
     * 
     * @param transactionType the transaction type
     * @return specification
     */
    public static Specification<BankTransaction> hasTransactionType(BankTransactionType transactionType) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.equal(root.get("transactionType"), transactionType);
    }

    /**
     * Filter by reference number (case-insensitive contains)
     * 
     * @param referenceNo the reference number
     * @return specification
     */
    public static Specification<BankTransaction> hasReferenceNo(String referenceNo) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.like(
                criteriaBuilder.lower(root.get("referenceNo")),
                "%" + referenceNo.toLowerCase() + "%"
            );
    }

    /**
     * Filter by UTR number (case-insensitive contains)
     * 
     * @param utrNo the UTR number
     * @return specification
     */
    public static Specification<BankTransaction> hasUtrNo(String utrNo) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.like(
                criteriaBuilder.lower(root.get("utrNo")),
                "%" + utrNo.toLowerCase() + "%"
            );
    }

    /**
     * Filter by reconciliation status
     * 
     * @param reconciled true/false
     * @return specification
     */
    public static Specification<BankTransaction> isReconciled(Boolean reconciled) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.equal(root.get("reconciled"), reconciled);
    }

    /**
     * Filter by date range
     * 
     * @param startDate start date (inclusive)
     * @param endDate end date (inclusive)
     * @return specification
     */
    public static Specification<BankTransaction> dateRange(LocalDate startDate, LocalDate endDate) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
            }
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("transactionDate"), endDate));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Filter by debit amount range
     * 
     * @param minAmount minimum debit amount
     * @param maxAmount maximum debit amount
     * @return specification
     */
    public static Specification<BankTransaction> debitAmountRange(BigDecimal minAmount, BigDecimal maxAmount) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (minAmount != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("debitAmount"), minAmount));
            }
            if (maxAmount != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("debitAmount"), maxAmount));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Filter by credit amount range
     * 
     * @param minAmount minimum credit amount
     * @param maxAmount maximum credit amount
     * @return specification
     */
    public static Specification<BankTransaction> creditAmountRange(BigDecimal minAmount, BigDecimal maxAmount) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (minAmount != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("creditAmount"), minAmount));
            }
            if (maxAmount != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("creditAmount"), maxAmount));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    /**
     * Filter by narration (case-insensitive contains)
     * 
     * @param narration the narration
     * @return specification
     */
    public static Specification<BankTransaction> hasNarration(String narration) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.like(
                criteriaBuilder.lower(root.get("narration")),
                "%" + narration.toLowerCase() + "%"
            );
    }

    /**
     * Filter non-deleted transactions
     * 
     * @return specification
     */
    public static Specification<BankTransaction> notDeleted() {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.equal(root.get("isDeleted"), false);
    }

    /**
     * Combine multiple specifications
     * 
     * @param specs variable number of specifications
     * @return combined specification
     */
    @SafeVarargs
    public static Specification<BankTransaction> and(Specification<BankTransaction>... specs) {
        Specification<BankTransaction> result = Specification.where(specs[0]);
        for (int i = 1; i < specs.length; i++) {
            result = result.and(specs[i]);
        }
        return result;
    }

    public static Specification<BankTransaction> getFilterSpecification(BankTransactionFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (filter == null) {
                predicates.add(cb.isFalse(root.get("isDeleted")));
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Deleted status (default to false if null)
            if (filter.getIsDeleted() != null) {
                predicates.add(cb.equal(root.get("isDeleted"), filter.getIsDeleted()));
            } else {
                predicates.add(cb.isFalse(root.get("isDeleted")));
            }

            if (filter.getBankAccountId() != null) {
                predicates.add(cb.equal(root.get("bankAccount").get("id"), filter.getBankAccountId()));
            }

            if (StringUtils.hasText(filter.getReferenceNo())) {
                predicates.add(cb.like(cb.lower(root.get("referenceNo")), "%" + filter.getReferenceNo().trim().toLowerCase() + "%"));
            }

            if (StringUtils.hasText(filter.getUtrNo())) {
                predicates.add(cb.like(cb.lower(root.get("utrNo")), "%" + filter.getUtrNo().trim().toLowerCase() + "%"));
            }

            if (filter.getTransactionType() != null) {
                predicates.add(cb.equal(root.get("transactionType"), filter.getTransactionType()));
            }

            if (filter.getReconciled() != null) {
                predicates.add(cb.equal(root.get("reconciled"), filter.getReconciled()));
            }

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("transactionDate"), filter.getFromDate()));
            }

            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("transactionDate"), filter.getToDate()));
            }

            if (filter.getMinDebitAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("debitAmount"), filter.getMinDebitAmount()));
            }

            if (filter.getMaxDebitAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("debitAmount"), filter.getMaxDebitAmount()));
            }

            if (filter.getMinCreditAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("creditAmount"), filter.getMinCreditAmount()));
            }

            if (filter.getMaxCreditAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("creditAmount"), filter.getMaxCreditAmount()));
            }

            if (StringUtils.hasText(filter.getNarration())) {
                predicates.add(cb.like(cb.lower(root.get("narration")), "%" + filter.getNarration().trim().toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
