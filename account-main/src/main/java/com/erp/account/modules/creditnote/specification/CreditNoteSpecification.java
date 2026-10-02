package com.erp.account.modules.creditnote.specification;

import com.erp.account.modules.creditnote.dto.request.CreditNoteFilterDto;
import com.erp.account.modules.creditnote.entity.CreditNote;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class CreditNoteSpecification {

    private CreditNoteSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<CreditNote> getFilterSpecification(CreditNoteFilterDto filter, UUID companyId) {
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
                Predicate noteNoLike = cb.like(cb.lower(root.get("creditNoteNo")), searchPattern);
                Predicate refNoLike = cb.like(cb.lower(root.get("referenceNo")), searchPattern);
                Predicate reasonLike = cb.like(cb.lower(root.get("reason")), searchPattern);
                predicates.add(cb.or(noteNoLike, refNoLike, reasonLike));
            }

            // Exact & Partial Match
            if (StringUtils.hasText(filter.getCreditNoteNo())) {
                predicates.add(cb.like(cb.lower(root.get("creditNoteNo")), "%" + filter.getCreditNoteNo().trim().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(filter.getReferenceNo())) {
                predicates.add(cb.like(cb.lower(root.get("referenceNo")), "%" + filter.getReferenceNo().trim().toLowerCase() + "%"));
            }
            
            // Entity Matches
            if (filter.getSalesInvoiceId() != null) {
                predicates.add(cb.equal(root.get("salesInvoice").get("id"), filter.getSalesInvoiceId()));
            }
            if (filter.getCustomerId() != null) {
                predicates.add(cb.equal(root.join("salesInvoice").get("customer").get("id"), filter.getCustomerId()));
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
