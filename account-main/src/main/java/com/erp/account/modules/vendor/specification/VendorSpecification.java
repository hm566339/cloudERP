package com.erp.account.modules.vendor.specification;

import com.erp.account.modules.vendor.dto.request.VendorFilterDto;
import com.erp.account.modules.vendor.entity.Vendor;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class VendorSpecification {

    private VendorSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<Vendor> getFilterSpecification(VendorFilterDto filter, UUID companyId) {
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
                Predicate codeLike = cb.like(cb.lower(root.get("vendorCode")), searchPattern);
                Predicate nameLike = cb.like(cb.lower(root.get("vendorName")), searchPattern);
                Predicate emailLike = cb.like(cb.lower(root.get("email")), searchPattern);
                Predicate phoneLike = cb.like(cb.lower(root.get("phone")), searchPattern);
                Predicate gstinLike = cb.like(cb.lower(root.get("gstin")), searchPattern);
                Predicate panLike = cb.like(cb.lower(root.get("panNo")), searchPattern);
                Predicate cityLike = cb.like(cb.lower(root.get("city")), searchPattern);
                Predicate stateLike = cb.like(cb.lower(root.get("state")), searchPattern);
                Predicate countryLike = cb.like(cb.lower(root.get("country")), searchPattern);
                Predicate pinLike = cb.like(cb.lower(root.get("pinCode")), searchPattern);
                
                predicates.add(cb.or(codeLike, nameLike, emailLike, phoneLike, gstinLike, panLike, cityLike, stateLike, countryLike, pinLike));
            }

            // String filters
            if (filter.getVendorCode() != null && !filter.getVendorCode().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("vendorCode")), "%" + filter.getVendorCode().trim().toLowerCase() + "%"));
            }
            if (filter.getVendorName() != null && !filter.getVendorName().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("vendorName")), "%" + filter.getVendorName().trim().toLowerCase() + "%"));
            }
            if (filter.getEmail() != null && !filter.getEmail().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("email")), "%" + filter.getEmail().trim().toLowerCase() + "%"));
            }
            if (filter.getPhone() != null && !filter.getPhone().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("phone")), "%" + filter.getPhone().trim().toLowerCase() + "%"));
            }
            if (filter.getGstin() != null && !filter.getGstin().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("gstin")), "%" + filter.getGstin().trim().toLowerCase() + "%"));
            }
            if (filter.getPan() != null && !filter.getPan().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("panNo")), "%" + filter.getPan().trim().toLowerCase() + "%"));
            }
            if (filter.getCity() != null && !filter.getCity().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("city")), "%" + filter.getCity().trim().toLowerCase() + "%"));
            }
            if (filter.getState() != null && !filter.getState().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("state")), "%" + filter.getState().trim().toLowerCase() + "%"));
            }
            if (filter.getCountry() != null && !filter.getCountry().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("country")), "%" + filter.getCountry().trim().toLowerCase() + "%"));
            }
            if (filter.getPinCode() != null && !filter.getPinCode().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("pinCode")), "%" + filter.getPinCode().trim().toLowerCase() + "%"));
            }

            // Numeric Ranges
            if (filter.getMinCreditLimit() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("creditLimit"), filter.getMinCreditLimit()));
            }
            if (filter.getMaxCreditLimit() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("creditLimit"), filter.getMaxCreditLimit()));
            }

            // Booleans
            if (filter.getIsActive() != null) {
                predicates.add(cb.equal(root.get("isActive"), filter.getIsActive()));
            }

            // Date Ranges
            if (filter.getCreatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getCreatedFrom()));
            }
            if (filter.getCreatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), filter.getCreatedTo()));
            }
            if (filter.getUpdatedFrom() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), filter.getUpdatedFrom()));
            }
            if (filter.getUpdatedTo() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("updatedAt"), filter.getUpdatedTo()));
            }

            // IDs IN
            if (filter.getIds() != null && !filter.getIds().isEmpty()) {
                predicates.add(root.get("id").in(filter.getIds()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
