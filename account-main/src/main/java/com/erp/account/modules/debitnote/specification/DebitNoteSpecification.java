package com.erp.account.modules.debitnote.specification;

import com.erp.account.modules.debitnote.dto.request.DebitNoteFilterDto;
import com.erp.account.modules.debitnote.entity.DebitNote;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class DebitNoteSpecification {

    private DebitNoteSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<DebitNote> getFilterSpecification(DebitNoteFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Global search
            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate noteNoLike = cb.like(cb.lower(root.get("debitNoteNo")), searchPattern);
                Predicate refNoLike = cb.like(cb.lower(root.get("referenceNo")), searchPattern);
                Predicate reasonLike = cb.like(cb.lower(root.get("reason")), searchPattern);
                predicates.add(cb.or(noteNoLike, refNoLike, reasonLike));
            }

            // Exact & Partial Match
            if (StringUtils.hasText(filter.getDebitNoteNo())) {
                predicates.add(cb.like(cb.lower(root.get("debitNoteNo")), "%" + filter.getDebitNoteNo().trim().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(filter.getReferenceNo())) {
                predicates.add(cb.like(cb.lower(root.get("referenceNo")), "%" + filter.getReferenceNo().trim().toLowerCase() + "%"));
            }
            
            // Entity Matches
            if (filter.getApInvoiceId() != null) {
                predicates.add(cb.equal(root.get("apInvoice").get("id"), filter.getApInvoiceId()));
            }
            if (filter.getVendorId() != null) {
                predicates.add(cb.equal(root.join("apInvoice").get("vendor").get("id"), filter.getVendorId()));
            }

            // Enums / Statuses
            if (filter.getStatuses() != null && !filter.getStatuses().isEmpty()) {
                predicates.add(root.get("status").in(filter.getStatuses()));
            }
            if (filter.getGlPostingStatuses() != null && !filter.getGlPostingStatuses().isEmpty()) {
                predicates.add(root.get("glPostingStatus").in(filter.getGlPostingStatuses()));
            }

            // Numeric Ranges
            if (filter.getMinAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("amount"), filter.getMinAmount()));
            }
            if (filter.getMaxAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("amount"), filter.getMaxAmount()));
            }

            // Date Ranges
            if (filter.getNoteDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("noteDate"), filter.getNoteDateFrom()));
            }
            if (filter.getNoteDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("noteDate"), filter.getNoteDateTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
