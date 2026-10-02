package com.erp.account.modules.paymentvoucher.specification;

import com.erp.account.modules.paymentvoucher.dto.request.PaymentVoucherFilterDto;
import com.erp.account.modules.paymentvoucher.entity.PaymentVoucher;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class PaymentVoucherSpecification {

    private PaymentVoucherSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<PaymentVoucher> getFilterSpecification(PaymentVoucherFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }
            if (filter != null && filter.getDeleted() != null) {
                predicates.add(cb.equal(root.get("isDeleted"), filter.getDeleted()));
            } else {
                predicates.add(cb.isFalse(root.get("isDeleted")));
            }

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Global search
            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate voucherNoLike = cb.like(cb.lower(root.get("voucherNo")), searchPattern);
                Predicate refNoLike = cb.like(cb.lower(root.get("referenceNo")), searchPattern);
                Predicate remarksLike = cb.like(cb.lower(root.get("remarks")), searchPattern);
                predicates.add(cb.or(voucherNoLike, refNoLike, remarksLike));
            }

            // Exact & Partial Match
            if (StringUtils.hasText(filter.getVoucherNo())) {
                predicates.add(cb.like(cb.lower(root.get("voucherNo")), "%" + filter.getVoucherNo().trim().toLowerCase() + "%"));
            }
            if (StringUtils.hasText(filter.getReferenceNo())) {
                predicates.add(cb.like(cb.lower(root.get("referenceNo")), "%" + filter.getReferenceNo().trim().toLowerCase() + "%"));
            }
            
            // Entity Matches
            if (filter.getVendorId() != null) {
                predicates.add(cb.equal(root.get("vendor").get("id"), filter.getVendorId()));
            }
            if (filter.getBankAccountId() != null) {
                predicates.add(cb.equal(root.get("bankAccount").get("id"), filter.getBankAccountId()));
            }
            if (filter.getCreatedBy() != null) {
                predicates.add(cb.equal(root.get("createdBy"), filter.getCreatedBy()));
            }
            if (filter.getUpdatedBy() != null) {
                predicates.add(cb.equal(root.get("updatedBy"), filter.getUpdatedBy()));
            }
            if (filter.getApprovedBy() != null) {
                predicates.add(cb.equal(root.get("approvedBy"), filter.getApprovedBy()));
            }

            // Enums / Statuses
            if (filter.getPaymentMode() != null) {
                predicates.add(cb.equal(root.get("paymentMode"), filter.getPaymentMode()));
            }
            if (filter.getPaymentModes() != null && !filter.getPaymentModes().isEmpty()) {
                predicates.add(root.get("paymentMode").in(filter.getPaymentModes()));
            }
            if (filter.getVoucherStatus() != null) {
                predicates.add(cb.equal(root.get("paymentStatus"), filter.getVoucherStatus()));
            }
            if (filter.getPaymentStatuses() != null && !filter.getPaymentStatuses().isEmpty()) {
                predicates.add(root.get("paymentStatus").in(filter.getPaymentStatuses()));
            }
            if (filter.getPostingStatus() != null) {
                predicates.add(cb.equal(root.get("glPostingStatus"), filter.getPostingStatus()));
            }
            if (filter.getGlPostingStatuses() != null && !filter.getGlPostingStatuses().isEmpty()) {
                predicates.add(root.get("glPostingStatus").in(filter.getGlPostingStatuses()));
            }

            // Numeric Ranges
            if (filter.getMinAmount() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("paymentAmount"), filter.getMinAmount()));
            }
            if (filter.getMaxAmount() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("paymentAmount"), filter.getMaxAmount()));
            }

            // Date Ranges
            if (filter.getVoucherDateFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("voucherDate"), filter.getVoucherDateFrom()));
            }
            if (filter.getVoucherDateTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("voucherDate"), filter.getVoucherDateTo()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<PaymentVoucher> getApPaymentFilterSpecification(com.erp.account.modules.appayment.dto.ApPaymentFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters - Multi-tenancy
            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }
            if (filter != null && filter.getIsDeleted() != null) {
                predicates.add(cb.equal(root.get("isDeleted"), filter.getIsDeleted()));
            } else {
                predicates.add(cb.isFalse(root.get("isDeleted")));
            }

            // Conceptual query rule: Both Normal AP Invoice Payments AND PO Advance Payments
            // Normal AP payment: allocation with apInvoice != null
            // PO advance payment: purchaseOrderId != null OR allocation with purchaseOrder != null
            // Also allow unallocated payment vouchers
            jakarta.persistence.criteria.Subquery<Long> allocSubquery = query.subquery(Long.class);
            jakarta.persistence.criteria.Root<com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation> allocRoot =
                    allocSubquery.from(com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation.class);
            allocSubquery.select(cb.literal(1L));
            allocSubquery.where(
                    cb.equal(allocRoot.get("paymentVoucher"), root),
                    cb.or(
                            cb.isNotNull(allocRoot.get("apInvoice")),
                            cb.isNotNull(allocRoot.get("purchaseOrder"))
                    )
            );

            Predicate validPaymentTypePredicate = cb.or(
                    cb.isNotNull(root.get("purchaseOrderId")),
                    cb.exists(allocSubquery),
                    cb.isEmpty(root.get("allocations"))
            );
            predicates.add(validPaymentTypePredicate);

            if (filter == null) {
                return cb.and(predicates.toArray(new Predicate[0]));
            }

            // Vendor
            if (filter.getVendorId() != null) {
                predicates.add(cb.equal(root.get("vendor").get("id"), filter.getVendorId()));
            }

            // Payment No / Voucher No
            String voucherNoFilter = StringUtils.hasText(filter.getVoucherNo()) ? filter.getVoucherNo() : filter.getPaymentNo();
            if (StringUtils.hasText(voucherNoFilter)) {
                predicates.add(cb.like(cb.lower(root.get("voucherNo")), "%" + voucherNoFilter.trim().toLowerCase() + "%"));
            }

            // Reference No
            if (StringUtils.hasText(filter.getReferenceNo())) {
                predicates.add(cb.like(cb.lower(root.get("referenceNo")), "%" + filter.getReferenceNo().trim().toLowerCase() + "%"));
            }

            // Payment Mode
            if (filter.getPaymentMode() != null) {
                predicates.add(cb.equal(root.get("paymentMode"), filter.getPaymentMode()));
            }

            // Payment Status
            if (filter.getPaymentStatus() != null) {
                predicates.add(cb.equal(root.get("paymentStatus"), filter.getPaymentStatus()));
            }

            // GL Posting Status
            if (filter.getGlPostingStatus() != null) {
                predicates.add(cb.equal(root.get("glPostingStatus"), filter.getGlPostingStatus()));
            }

            // Payment Date range
            if (filter.getFromPaymentDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("voucherDate"), filter.getFromPaymentDate()));
            }
            if (filter.getToPaymentDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("voucherDate"), filter.getToPaymentDate()));
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

            // Purchase Order ID
            if (filter.getPurchaseOrderId() != null) {
                jakarta.persistence.criteria.Subquery<Long> poAllocSubquery = query.subquery(Long.class);
                jakarta.persistence.criteria.Root<com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation> poAllocRoot =
                        poAllocSubquery.from(com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation.class);
                poAllocSubquery.select(cb.literal(1L));
                poAllocSubquery.where(
                        cb.equal(poAllocRoot.get("paymentVoucher"), root),
                        cb.equal(poAllocRoot.get("purchaseOrder").get("id"), filter.getPurchaseOrderId())
                );
                predicates.add(cb.or(
                        cb.equal(root.get("purchaseOrderId"), filter.getPurchaseOrderId()),
                        cb.exists(poAllocSubquery)
                ));
            }

            // AP Invoice ID
            if (filter.getApInvoiceId() != null) {
                jakarta.persistence.criteria.Subquery<Long> invAllocSubquery = query.subquery(Long.class);
                jakarta.persistence.criteria.Root<com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation> invAllocRoot =
                        invAllocSubquery.from(com.erp.account.modules.paymentvoucher.entity.PaymentVoucherAllocation.class);
                invAllocSubquery.select(cb.literal(1L));
                invAllocSubquery.where(
                        cb.equal(invAllocRoot.get("paymentVoucher"), root),
                        cb.equal(invAllocRoot.get("apInvoice").get("id"), filter.getApInvoiceId())
                );
                predicates.add(cb.exists(invAllocSubquery));
            }

            // Audit
            if (filter.getCreatedBy() != null) {
                predicates.add(cb.equal(root.get("createdBy"), filter.getCreatedBy()));
            }
            if (filter.getUpdatedBy() != null) {
                predicates.add(cb.equal(root.get("updatedBy"), filter.getUpdatedBy()));
            }
            if (filter.getFromCreatedDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromCreatedDate()));
            }
            if (filter.getToCreatedDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getToCreatedDate()));
            }

            // Search Keyword
            if (StringUtils.hasText(filter.getSearchKeyword())) {
                String pattern = "%" + filter.getSearchKeyword().trim().toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("voucherNo")), pattern),
                        cb.like(cb.lower(root.get("referenceNo")), pattern),
                        cb.like(cb.lower(root.get("remarks")), pattern),
                        cb.like(cb.lower(root.get("vendor").get("vendorName")), pattern)
                ));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
