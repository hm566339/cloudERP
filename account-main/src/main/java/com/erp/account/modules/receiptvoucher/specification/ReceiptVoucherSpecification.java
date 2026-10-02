package com.erp.account.modules.receiptvoucher.specification;

import com.erp.account.modules.receiptvoucher.dto.request.ReceiptVoucherFilterDto;
import com.erp.account.modules.receiptvoucher.entity.ReceiptVoucher;
import com.erp.account.enums.PaymentMode;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ReceiptVoucherSpecification {

    private ReceiptVoucherSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<ReceiptVoucher> getFilterSpecification(ReceiptVoucherFilterDto filter, UUID companyId) {
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
                Predicate receiptNoLike = cb.like(cb.lower(root.get("receiptNo")), searchPattern);
                Predicate refNoLike = cb.like(cb.lower(root.get("referenceNo")), searchPattern);
                Predicate paymentModeLike = cb.like(cb.lower(root.get("paymentMode").as(String.class)), searchPattern);
                predicates.add(cb.or(receiptNoLike, refNoLike, paymentModeLike));
            }

            // Exact & Partial Match
            if (StringUtils.hasText(filter.getReceiptNo())) {
                predicates.add(cb.like(cb.lower(root.get("receiptNo")), "%" + filter.getReceiptNo().trim().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(filter.getReferenceNo())) {
                predicates.add(cb.like(cb.lower(root.get("referenceNo")), "%" + filter.getReferenceNo().trim().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(filter.getPaymentMode())) {
                predicates.add(cb.equal(root.get("paymentMode"), PaymentMode.valueOf(filter.getPaymentMode().trim().toUpperCase())));
            }
            
            // Entity Matches
            if (filter.getCustomerId() != null) {
                predicates.add(cb.equal(root.get("customer").get("id"), filter.getCustomerId()));
            }
            if (filter.getSalesInvoiceId() != null || filter.getArInvoiceId() != null) {
                UUID targetInvoiceId = filter.getSalesInvoiceId() != null ? filter.getSalesInvoiceId() : filter.getArInvoiceId();
                predicates.add(cb.equal(root.join("allocations", JoinType.INNER).get("salesInvoice").get("id"), targetInvoiceId));
                query.distinct(true);
            }

            if (filter.getReceiptStatuses() != null && !filter.getReceiptStatuses().isEmpty()) {
                predicates.add(root.get("receiptStatus").in(filter.getReceiptStatuses()));
            }
            if (filter.getPostingStatuses() != null && !filter.getPostingStatuses().isEmpty()) {
                predicates.add(root.get("glPostingStatus").in(filter.getPostingStatuses()));
            }

            // Numeric Ranges
            if (filter.getMinAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("receiptAmount"), filter.getMinAmount()));
            }
            if (filter.getMaxAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("receiptAmount"), filter.getMaxAmount()));
            }

            // Date Ranges
            if (filter.getReceiptDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("receiptDate"), filter.getReceiptDateFrom()));
            }
            if (filter.getReceiptDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("receiptDate"), filter.getReceiptDateTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

