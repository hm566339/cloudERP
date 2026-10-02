package com.erp.account.modules.invoicetax.specification;

import com.erp.account.modules.invoicetax.dto.InvoiceTaxFilterDto;
import com.erp.account.modules.invoicetax.entity.InvoiceTax;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class InvoiceTaxSpecification {

    private InvoiceTaxSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<InvoiceTax> getFilterSpecification(InvoiceTaxFilterDto filter, UUID invoiceId, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }
            if (invoiceId != null) {
                predicates.add(cb.equal(root.get("salesInvoice").get("id"), invoiceId));
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

            if (filter.getGstSlabId() != null) {
                predicates.add(cb.equal(root.get("gstSlab").get("id"), filter.getGstSlabId()));
            }
            
            if (StringUtils.hasText(filter.getGstSlabName())) {
                predicates.add(cb.like(cb.lower(root.get("gstSlab").get("slabName")), "%" + filter.getGstSlabName().trim().toLowerCase() + "%"));
            }

            if (filter.getMinTaxableAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("taxableAmount"), filter.getMinTaxableAmount()));
            }
            if (filter.getMaxTaxableAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("taxableAmount"), filter.getMaxTaxableAmount()));
            }

            if (filter.getCreatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt").as(java.time.LocalDate.class), filter.getCreatedFrom()));
            }
            if (filter.getCreatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt").as(java.time.LocalDate.class), filter.getCreatedTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
