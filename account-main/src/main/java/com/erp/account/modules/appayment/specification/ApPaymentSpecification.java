package com.erp.account.modules.appayment.specification;

import com.erp.account.modules.appayment.dto.ApPaymentFilterDto;
import com.erp.account.modules.appayment.entity.ApPayment;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class ApPaymentSpecification {

    private ApPaymentSpecification() {
        throw new UnsupportedOperationException("Specification utility class");
    }

    public static Specification<ApPayment> getFilterSpecification(ApPaymentFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Multi-tenancy
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

            if (filter == null) {
                predicates.add(cb.isFalse(root.get("isDeleted")));
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Soft delete
            if (filter.getIsDeleted() != null) {
                predicates.add(cb.equal(root.get("isDeleted"), filter.getIsDeleted()));
            } else {
                predicates.add(cb.isFalse(root.get("isDeleted")));
            }

            // Vendor FK
            if (filter.getVendorId() != null) {
                predicates.add(cb.equal(root.get("vendor").get("id"), filter.getVendorId()));
            }

            // Payment No (exact or partial)
            if (StringUtils.hasText(filter.getPaymentNo())) {
                predicates.add(cb.like(cb.lower(root.get("paymentNo")),
                        "%" + filter.getPaymentNo().trim().toLowerCase() + "%"));
            }

            // Reference No
            if (StringUtils.hasText(filter.getReferenceNo())) {
                predicates.add(cb.like(cb.lower(root.get("referenceNo")),
                        "%" + filter.getReferenceNo().trim().toLowerCase() + "%"));
            }

            // Enum: PaymentMode
            if (filter.getPaymentMode() != null) {
                predicates.add(cb.equal(root.get("paymentMode"), filter.getPaymentMode()));
            }

            // Enum: PaymentStatus
            if (filter.getPaymentStatus() != null) {
                predicates.add(cb.equal(root.get("paymentStatus"), filter.getPaymentStatus()));
            }

            // Enum: GL Posting Status
            if (filter.getGlPostingStatus() != null) {
                predicates.add(cb.equal(root.get("glPostingStatus"), filter.getGlPostingStatus()));
            }

            // Payment Date range
            if (filter.getFromPaymentDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("paymentDate"), filter.getFromPaymentDate()));
            }
            if (filter.getToPaymentDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("paymentDate"), filter.getToPaymentDate()));
            }

            // Payment Amount range
            if (filter.getMinPaymentAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("paymentAmount"), filter.getMinPaymentAmount()));
            }
            if (filter.getMaxPaymentAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("paymentAmount"), filter.getMaxPaymentAmount()));
            }

            // Total Allocated Amount range
            if (filter.getMinAllocatedAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("totalAllocatedAmount"), filter.getMinAllocatedAmount()));
            }
            if (filter.getMaxAllocatedAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("totalAllocatedAmount"), filter.getMaxAllocatedAmount()));
            }

            // GL Journal Entry ID
            if (filter.getGlJournalEntryId() != null) {
                predicates.add(cb.equal(root.get("glJournalEntryId"), filter.getGlJournalEntryId()));
            }

            // Audit: CreatedBy
            if (filter.getCreatedBy() != null) {
                predicates.add(cb.equal(root.get("createdBy"), filter.getCreatedBy()));
            }

            // Audit: UpdatedBy
            if (filter.getUpdatedBy() != null) {
                predicates.add(cb.equal(root.get("updatedBy"), filter.getUpdatedBy()));
            }

            // CreatedAt date range
            if (filter.getFromCreatedDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromCreatedDate()));
            }
            if (filter.getToCreatedDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getToCreatedDate()));
            }

            // Search keyword across paymentNo, referenceNo, vendor name
            if (StringUtils.hasText(filter.getSearchKeyword())) {
                String pattern = "%" + filter.getSearchKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("paymentNo")), pattern),
                        cb.like(cb.lower(root.get("referenceNo")), pattern),
                        cb.like(cb.lower(root.get("vendor").get("vendorName")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
