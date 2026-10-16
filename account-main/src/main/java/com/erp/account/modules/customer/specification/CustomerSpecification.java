package com.erp.account.modules.customer.specification;

import com.erp.account.modules.customer.dto.request.CustomerFilterDto;
import com.erp.account.modules.customer.entity.Customer;
import com.erp.account.modules.customer.entity.CustomerAddress;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class CustomerSpecification {

    private CustomerSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<Customer> getFilterSpecification(CustomerFilterDto filter, UUID companyId) {
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

            boolean needsAddressJoin = (filter.getSearchKey() != null && !filter.getSearchKey().isBlank())
                    || (filter.getCity() != null && !filter.getCity().isBlank())
                    || (filter.getState() != null && !filter.getState().isBlank())
                    || (filter.getCountry() != null && !filter.getCountry().isBlank());

            Join<Customer, CustomerAddress> addressJoin = null;
            if (needsAddressJoin) {
                addressJoin = root.join("addresses", JoinType.LEFT);
                if (query != null) {
                    query.distinct(true);
                }
            }

            // Global search
            if (filter.getSearchKey() != null && !filter.getSearchKey().isBlank()) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate codeLike = cb.like(cb.lower(root.get("customerCode")), searchPattern);
                Predicate nameLike = cb.like(cb.lower(root.get("customerName")), searchPattern);
                Predicate emailLike = cb.like(cb.lower(root.get("email")), searchPattern);
                Predicate phoneLike = cb.like(cb.lower(root.get("phone")), searchPattern);
                Predicate gstinLike = cb.like(cb.lower(root.get("gstin")), searchPattern);
                Predicate panLike = cb.like(cb.lower(root.get("panNo")), searchPattern);
                if (addressJoin != null) {
                    Predicate cityLike = cb.like(cb.lower(addressJoin.get("city")), searchPattern);
                    Predicate stateLike = cb.or(
                        cb.like(cb.lower(addressJoin.get("gstState").get("stateName")), searchPattern),
                        cb.like(cb.lower(addressJoin.get("gstState").get("stateCode")), searchPattern));
                    Predicate countryLike = cb.like(cb.lower(addressJoin.get("country")), searchPattern);
                    predicates.add(cb.or(codeLike, nameLike, emailLike, phoneLike, gstinLike, panLike, cityLike, stateLike, countryLike));
                } else {
                    predicates.add(cb.or(codeLike, nameLike, emailLike, phoneLike, gstinLike, panLike));
                }
            }

            // String filters
            if (filter.getCustomerCode() != null && !filter.getCustomerCode().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("customerCode")), "%" + filter.getCustomerCode().trim().toLowerCase() + "%"));
            }
            if (filter.getCustomerName() != null && !filter.getCustomerName().isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("customerName")), "%" + filter.getCustomerName().trim().toLowerCase() + "%"));
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
            if (addressJoin != null && filter.getCity() != null && !filter.getCity().isBlank()) {
                predicates.add(cb.like(cb.lower(addressJoin.get("city")), "%" + filter.getCity().trim().toLowerCase() + "%"));
            }
            if (addressJoin != null && filter.getState() != null && !filter.getState().isBlank()) {
                predicates.add(cb.or(
                    cb.like(cb.lower(addressJoin.get("gstState").get("stateName")), "%" + filter.getState().trim().toLowerCase() + "%"),
                    cb.like(cb.lower(addressJoin.get("gstState").get("stateCode")), "%" + filter.getState().trim().toLowerCase() + "%")));
            }
            if (addressJoin != null && filter.getCountry() != null && !filter.getCountry().isBlank()) {
                predicates.add(cb.like(cb.lower(addressJoin.get("country")), "%" + filter.getCountry().trim().toLowerCase() + "%"));
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
