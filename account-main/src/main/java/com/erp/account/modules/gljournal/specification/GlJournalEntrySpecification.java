package com.erp.account.modules.gljournal.specification;

import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.gljournal.dto.request.GlJournalEntryFilterDto;
import com.erp.account.modules.gljournal.entity.GlJournalEntry;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class GlJournalEntrySpecification {

    private GlJournalEntrySpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<GlJournalEntry> getFilterSpecification(GlJournalEntryFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }
            predicates.add(cb.isFalse(root.get("isDeleted")));
                // convert provided string list to enum names for comparison

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Global search
            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate voucherNoLike = cb.like(cb.lower(root.get("voucherNo")), searchPattern);
                Predicate refNoLike = cb.like(cb.lower(root.get("referenceNo")), searchPattern);
                Predicate narrationLike = cb.like(cb.lower(root.get("narration")), searchPattern);
                predicates.add(cb.or(voucherNoLike, refNoLike, narrationLike));
            }

            // Exact & Partial Match
            if (StringUtils.hasText(filter.getVoucherNo())) {
                predicates.add(cb.like(cb.lower(root.get("voucherNo")), "%" + filter.getVoucherNo().trim().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(filter.getReferenceNo())) {
                predicates.add(cb.like(cb.lower(root.get("referenceNo")), "%" + filter.getReferenceNo().trim().toLowerCase() + "%"));
            }
            
            // List and ID Match
            if (filter.getSourceModules() != null && !filter.getSourceModules().isEmpty()) {
                // sourceModules from API are strings; compare against enum names
                predicates.add(root.get("sourceModule").in(filter.getSourceModules()));
            }
            if (filter.getSourceId() != null) {
                predicates.add(cb.equal(root.get("sourceId"), filter.getSourceId()));
            }
            if (filter.getStatuses() != null && !filter.getStatuses().isEmpty()) {
                predicates.add(root.get("status").in(filter.getStatuses()));
            }
            if (filter.getFiscalYearId() != null) {
                predicates.add(cb.equal(root.get("fiscalYear").get("id"), filter.getFiscalYearId()));
            }
            if (filter.getAccountingPeriodId() != null) {
                predicates.add(cb.equal(root.get("accountingPeriod").get("id"), filter.getAccountingPeriodId()));
            }
            if (filter.getPostedBy() != null) {
                predicates.add(cb.equal(root.get("postedBy"), filter.getPostedBy()));
            }
            if (filter.getIds() != null && !filter.getIds().isEmpty()) {
                predicates.add(root.get("id").in(filter.getIds()));
            }

            // Numeric Ranges
            if (filter.getMinAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("totalDebit"), filter.getMinAmount()));
            }
            if (filter.getMaxAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("totalDebit"), filter.getMaxAmount()));
            }

            // Date Ranges
            if (filter.getVoucherDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("voucherDate"), filter.getVoucherDateFrom()));
            }
            if (filter.getVoucherDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("voucherDate"), filter.getVoucherDateTo()));
            }

            // Account ID Join Filter
            if (filter.getAccountId() != null) {
                Join<GlJournalEntry, GlJournalLine> lineJoin = root.join("journalLines");
                predicates.add(cb.equal(lineJoin.get("account").get("id"), filter.getAccountId()));
                query.distinct(true); // Distinct to prevent duplicates when multiple lines match
            }

            // Virtual Boolean Filter
            if (Boolean.TRUE.equals(filter.getIsUnbalanced())) {
                predicates.add(cb.notEqual(root.get("totalDebit"), root.get("totalCredit")));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
