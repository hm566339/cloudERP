package com.erp.account.modules.salesinvoice.specification;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.enums.PostingStatus;
import com.erp.account.modules.salesinvoice.dto.SalesInvoiceFilterDto;
import com.erp.account.modules.salesinvoice.entity.SalesInvoice;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class SalesInvoiceSpecification {

    private SalesInvoiceSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<SalesInvoice> getFilterSpecification(SalesInvoiceFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters
            if (companyId != null) {
                predicates.add(cb.equal(root.get("companyId"), companyId));
            }
            predicates.add(cb.isFalse(root.get("isDeleted")));

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Global search
            if (filter.getSearchKey() != null && !filter.getSearchKey().isBlank()) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate noLike = cb.like(cb.lower(root.get("invoiceNumber")), searchPattern);
                Predicate customerNameLike = cb.like(cb.lower(root.get("customer").get("customerName")), searchPattern);
                
                predicates.add(cb.or(noLike, customerNameLike));
            }

            // String and exact filters
            if (filter.getInvoiceNumber() != null && !filter.getInvoiceNumber().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("invoiceNumber")), "%" + filter.getInvoiceNumber().trim().toLowerCase() + "%"));
            }
            if (filter.getCustomerId() != null) {
                predicates.add(cb.equal(root.get("customerId"), filter.getCustomerId()));
            }
            if (filter.getInvoiceCurrency() != null && !filter.getInvoiceCurrency().isBlank()) {
                predicates.add(cb.equal(root.get("invoiceCurrency"), filter.getInvoiceCurrency()));
            }
            if (filter.getApprovedBy() != null) {
                predicates.add(cb.equal(root.get("approvedBy"), filter.getApprovedBy()));
            }
            if (filter.getPostedBy() != null) {
                predicates.add(cb.equal(root.get("postedBy"), filter.getPostedBy()));
            }

            // List filters
            if (filter.getStatuses() != null && !filter.getStatuses().isEmpty()) {
                predicates.add(root.get("status").in(filter.getStatuses()));
            }
            if (filter.getPostingStatuses() != null && !filter.getPostingStatuses().isEmpty()) {
                predicates.add(root.get("glPostingStatus").in(filter.getPostingStatuses()));
            }
            if (filter.getIds() != null && !filter.getIds().isEmpty()) {
                predicates.add(root.get("id").in(filter.getIds()));
            }

            // Numeric Ranges
            if (filter.getMinTotalAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("totalAmount"), filter.getMinTotalAmount()));
            }
            if (filter.getMaxTotalAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("totalAmount"), filter.getMaxTotalAmount()));
            }
            if (filter.getMinOutstandingAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("outstandingAmount"), filter.getMinOutstandingAmount()));
            }
            if (filter.getMaxOutstandingAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("outstandingAmount"), filter.getMaxOutstandingAmount()));
            }

            // Date Ranges
            if (filter.getInvoiceDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("invoiceDate"), filter.getInvoiceDateFrom()));
            }
            if (filter.getInvoiceDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("invoiceDate"), filter.getInvoiceDateTo()));
            }
            if (filter.getDueDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("dueDate"), filter.getDueDateFrom()));
            }
            if (filter.getDueDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("dueDate"), filter.getDueDateTo()));
            }

            // Virtual Boolean Flags
            if (Boolean.TRUE.equals(filter.getHasOutstandingBalance())) {
                predicates.add(cb.greaterThan(root.get("outstandingAmount"), java.math.BigDecimal.ZERO));
                predicates.add(root.get("status").in(InvoiceStatus.POSTED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.APPROVED));
            }

            if (Boolean.TRUE.equals(filter.getEligibleForCreditNote())) {
                predicates.add(cb.greaterThan(root.get("outstandingAmount"), java.math.BigDecimal.ZERO));
                predicates.add(root.get("status").in(InvoiceStatus.POSTED, InvoiceStatus.PARTIALLY_PAID));
            }
            
            // Status filters mapped properly for aging
            if (filter.getIsOverdue() != null && filter.getIsOverdue()) {
                predicates.add(cb.lessThan(root.get("dueDate"), LocalDate.now()));
                predicates.add(cb.greaterThan(root.get("outstandingAmount"), java.math.BigDecimal.ZERO));
                predicates.add(cb.notEqual(root.get("status"), InvoiceStatus.PAID));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
