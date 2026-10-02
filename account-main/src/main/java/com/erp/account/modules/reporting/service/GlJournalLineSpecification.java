package com.erp.account.modules.reporting.service;

import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import com.erp.account.modules.gljournal.enums.SourceModule;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.reporting.dto.request.GeneralLedgerRequest;
import org.springframework.data.jpa.domain.Specification;

import jakarta.persistence.criteria.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class GlJournalLineSpecification {

    public static Specification<GlJournalLine> getFilterSpecification(
            GeneralLedgerRequest request, UUID companyId, boolean forOpeningBalance) {

        return (root, query, cb) -> {
            // Only fetch when it's not a count query
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                root.fetch("journalEntry", JoinType.LEFT);
                root.fetch("account", JoinType.LEFT);
            }

            Join<GlJournalLine, GlJournalEntry> entryJoin = root.join("journalEntry", JoinType.LEFT);
            List<Predicate> predicates = new ArrayList<>();

            // 1. Mandatory filters
            predicates.add(cb.equal(root.get("company").get("id"), companyId));
            predicates.add(cb.equal(root.get("isDeleted"), false));
            predicates.add(cb.equal(entryJoin.get("isDeleted"), false));

            if (request.getAccountId() != null) {
                predicates.add(cb.equal(root.get("account").get("id"), request.getAccountId()));
            }

            // 2. Date filters
            if (forOpeningBalance) {
                if (request.getFromDate() != null) {
                    predicates.add(cb.lessThan(entryJoin.get("voucherDate"), request.getFromDate()));
                }
            } else {
                if (request.getFromDate() != null) {
                    predicates.add(cb.greaterThanOrEqualTo(entryJoin.get("voucherDate"), request.getFromDate()));
                }
                if (request.getToDate() != null) {
                    predicates.add(cb.lessThanOrEqualTo(entryJoin.get("voucherDate"), request.getToDate()));
                }
            }

            // 3. Optional filters
            if (request.getBranchId() != null) {
                predicates.add(cb.equal(root.get("branchId"), request.getBranchId()));
            }
            if (request.getCostCenterId() != null) {
                predicates.add(cb.equal(root.get("costCenterId"), request.getCostCenterId()));
            }
            if (request.getProjectId() != null) {
                predicates.add(cb.equal(root.get("projectId"), request.getProjectId()));
            }
            if (request.getCurrency() != null && !request.getCurrency().isEmpty()) {
                predicates.add(cb.equal(root.get("currencyCode"), request.getCurrency()));
            }
            
            if (request.getVoucherType() != null && !request.getVoucherType().isEmpty()) {
                CriteriaBuilder.In<SourceModule> inClause = cb.in(entryJoin.get("sourceModule"));
                for (String vt : request.getVoucherType()) {
                    try {
                        inClause.value(SourceModule.valueOf(vt));
                    } catch (IllegalArgumentException e) {
                        // ignore invalid enums
                    }
                }
                predicates.add(inClause);
            }

            if (request.getVoucherNumber() != null && !request.getVoucherNumber().isEmpty()) {
                predicates.add(cb.equal(entryJoin.get("voucherNo"), request.getVoucherNumber()));
            }

            if (request.getReferenceNo() != null && !request.getReferenceNo().isEmpty()) {
                predicates.add(cb.like(cb.lower(entryJoin.get("referenceNo")), "%" + request.getReferenceNo().toLowerCase() + "%"));
            }

            if (request.getNarration() != null && !request.getNarration().isEmpty()) {
                Predicate p1 = cb.like(cb.lower(entryJoin.get("narration")), "%" + request.getNarration().toLowerCase() + "%");
                Predicate p2 = cb.like(cb.lower(root.get("lineDescription")), "%" + request.getNarration().toLowerCase() + "%");
                predicates.add(cb.or(p1, p2));
            }

            if (forOpeningBalance) {
                predicates.add(cb.equal(entryJoin.get("status"), PostingStatus.POSTED));
            } else {
                if (request.getStatus() != null && !request.getStatus().isEmpty()) {
                    try {
                        predicates.add(cb.equal(entryJoin.get("status"), PostingStatus.valueOf(request.getStatus())));
                    } catch (IllegalArgumentException e) {
                        // ignore invalid status
                    }
                } else {
                    // By default ERP ledger reports only show POSTED transactions
                    predicates.add(cb.equal(entryJoin.get("status"), PostingStatus.POSTED));
                }
            }

            if (request.getCreatedBy() != null) {
                predicates.add(cb.equal(entryJoin.get("createdBy"), request.getCreatedBy()));
            }

            // Transaction Type & Amounts
            if ("DEBIT".equalsIgnoreCase(request.getTransactionType())) {
                predicates.add(cb.greaterThan(root.get("debitAmount"), BigDecimal.ZERO));
                applyAmountFilter(root, cb, predicates, "debitAmount", request.getMinAmount(), request.getMaxAmount());
            } else if ("CREDIT".equalsIgnoreCase(request.getTransactionType())) {
                predicates.add(cb.greaterThan(root.get("creditAmount"), BigDecimal.ZERO));
                applyAmountFilter(root, cb, predicates, "creditAmount", request.getMinAmount(), request.getMaxAmount());
            } else {
                // Min/Max applies to the actual amount > 0, whether debit or credit
                if (request.getMinAmount() != null || request.getMaxAmount() != null) {
                    Predicate debitMatch = buildAmountPredicate(root, cb, "debitAmount", request.getMinAmount(), request.getMaxAmount());
                    Predicate creditMatch = buildAmountPredicate(root, cb, "creditAmount", request.getMinAmount(), request.getMaxAmount());
                    predicates.add(cb.or(
                            cb.and(cb.greaterThan(root.get("debitAmount"), BigDecimal.ZERO), debitMatch),
                            cb.and(cb.greaterThan(root.get("creditAmount"), BigDecimal.ZERO), creditMatch)
                    ));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static void applyAmountFilter(Root<GlJournalLine> root, CriteriaBuilder cb, List<Predicate> predicates, String field, BigDecimal min, BigDecimal max) {
        if (min != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get(field), min));
        }
        if (max != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get(field), max));
        }
    }

    private static Predicate buildAmountPredicate(Root<GlJournalLine> root, CriteriaBuilder cb, String field, BigDecimal min, BigDecimal max) {
        List<Predicate> ps = new ArrayList<>();
        if (min != null) {
            ps.add(cb.greaterThanOrEqualTo(root.get(field), min));
        }
        if (max != null) {
            ps.add(cb.lessThanOrEqualTo(root.get(field), max));
        }
        return ps.isEmpty() ? cb.conjunction() : cb.and(ps.toArray(new Predicate[0]));
    }
}
