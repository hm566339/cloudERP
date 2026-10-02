package com.erp.account.modules.apinvoice.specification;

import com.erp.account.enums.InvoiceStatus;
import com.erp.account.modules.apinvoice.dto.request.ApInvoiceFilterDto;
import com.erp.account.modules.apinvoice.entity.ApInvoice;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ApInvoiceSpecification {

    private ApInvoiceSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<ApInvoice> getFilterSpecification(ApInvoiceFilterDto filter, UUID companyId) {
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
            if (filter.getSearchKey() != null && !filter.getSearchKey().isBlank()) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate noLike = cb.like(cb.lower(root.get("invoiceNo")), searchPattern);
                Predicate vendorNameLike = cb.like(cb.lower(root.get("vendor").get("vendorName")), searchPattern);
                
                predicates.add(cb.or(noLike, vendorNameLike));
            }

            // String and exact filters
            if (filter.getInvoiceNo() != null && !filter.getInvoiceNo().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("invoiceNo")), "%" + filter.getInvoiceNo().trim().toLowerCase() + "%"));
            }
            if (filter.getVendorId() != null) {
                predicates.add(cb.equal(root.get("vendor").get("id"), filter.getVendorId()));
            }
            if (filter.getInvoiceCurrency() != null && !filter.getInvoiceCurrency().isBlank()) {
                predicates.add(cb.equal(root.get("invoiceCurrency"), filter.getInvoiceCurrency()));
            }
            if (filter.getApprovedBy() != null) {
                predicates.add(cb.equal(root.get("approvedBy"), filter.getApprovedBy()));
            }

            // List filters
            if (filter.getStatuses() != null && !filter.getStatuses().isEmpty()) {
                predicates.add(root.get("status").in(filter.getStatuses()));
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
                predicates.add(cb.greaterThan(root.get("outstandingAmount"), 0));
                predicates.add(root.get("status").in(InvoiceStatus.POSTED, InvoiceStatus.PARTIALLY_PAID));
            }
            
            if (Boolean.TRUE.equals(filter.getIsOverdue())) {
                predicates.add(cb.lessThan(root.get("dueDate"), LocalDate.now()));
                predicates.add(cb.greaterThan(root.get("outstandingAmount"), 0));
                predicates.add(root.get("status").in(InvoiceStatus.POSTED, InvoiceStatus.PARTIALLY_PAID));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
