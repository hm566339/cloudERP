package com.erp.account.modules.gljournal.specification;

import com.erp.account.modules.gljournal.dto.request.GlJournalLineFilterDto;
import com.erp.account.modules.gljournal.entity.GlJournalLine;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class GlJournalLineSpecification {

    private GlJournalLineSpecification() {
        throw new UnsupportedOperationException("Specification is a utility class");
    }

    public static Specification<GlJournalLine> getFilterSpecification(GlJournalLineFilterDto filter, UUID companyId) {
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

            if (filter.getJournalEntryId() != null) {
                predicates.add(cb.equal(root.get("journalEntry").get("id"), filter.getJournalEntryId()));
            }

            if (filter.getAccountId() != null) {
                predicates.add(cb.equal(root.get("account").get("id"), filter.getAccountId()));
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

            if (StringUtils.hasText(filter.getCurrencyCode())) {
                predicates.add(cb.equal(root.get("currencyCode"), filter.getCurrencyCode()));
            }

            if (StringUtils.hasText(filter.getDescription())) {
                predicates.add(cb.like(cb.lower(root.get("lineDescription")), "%" + filter.getDescription().trim().toLowerCase() + "%"));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
