package com.erp.account.modules.bankaccount.specification;

import com.erp.account.modules.bankaccount.dto.request.BankAccountFilterDto;
import com.erp.account.modules.bankaccount.entity.BankAccount;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class BankAccountSpecification {

    private BankAccountSpecification() {
        throw new UnsupportedOperationException("Specification utility class");
    }

    public static Specification<BankAccount> getFilterSpecification(BankAccountFilterDto filter, UUID companyId) {
        return (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Implicit filters
            if (companyId != null) {
                predicates.add(builder.equal(root.get("company").get("id"), companyId));
            }
            predicates.add(builder.equal(root.get("isDeleted"), false));

            if (filter == null) {
                return builder.and(predicates.toArray(new Predicate[0]));
            }

            // Global search
            if (filter.getSearchKey() != null && !filter.getSearchKey().isBlank()) {
                String searchPattern = "%" + filter.getSearchKey().toLowerCase() + "%";
                Predicate bankNameLike = builder.like(builder.lower(root.get("bankName")), searchPattern);
                Predicate branchNameLike = builder.like(builder.lower(root.get("branchName")), searchPattern);
                Predicate accountNumLike = builder.like(builder.lower(root.get("accountNumber").as(String.class)),
                        searchPattern);
                Predicate ifscLike = builder.like(builder.lower(root.get("ifscCode").as(String.class)), searchPattern);
                Predicate upiLike = builder.like(builder.lower(root.get("upiId")), searchPattern);
                predicates.add(builder.or(bankNameLike, branchNameLike, accountNumLike, ifscLike, upiLike));
            }

            // String filters
            if (filter.getBankName() != null && !filter.getBankName().isBlank()) {
                predicates.add(builder.like(builder.lower(root.get("bankName")),
                        "%" + filter.getBankName().toLowerCase() + "%"));
            }
            if (filter.getBranchName() != null && !filter.getBranchName().isBlank()) {
                predicates.add(builder.like(builder.lower(root.get("branchName")),
                        "%" + filter.getBranchName().toLowerCase() + "%"));
            }
            if (filter.getAccountNumber() != null && !filter.getAccountNumber().isBlank()) {
                predicates.add(builder.like(builder.lower(root.get("accountNumber").as(String.class)),
                        "%" + filter.getAccountNumber().toLowerCase() + "%"));
            }
            if (filter.getIfscCode() != null && !filter.getIfscCode().isBlank()) {
                predicates.add(builder.like(builder.lower(root.get("ifscCode").as(String.class)),
                        "%" + filter.getIfscCode().toLowerCase() + "%"));
            }
            if (filter.getUpiId() != null && !filter.getUpiId().isBlank()) {
                predicates.add(
                        builder.like(builder.lower(root.get("upiId")), "%" + filter.getUpiId().toLowerCase() + "%"));
            }

            // Enums
            if (filter.getAccountTypes() != null && !filter.getAccountTypes().isEmpty()) {
                predicates.add(root.get("accountType").in(filter.getAccountTypes()));
            }

            // Numeric Ranges
            if (filter.getMinOpeningBalance() != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("openingBalance"), filter.getMinOpeningBalance()));
            }
            if (filter.getMaxOpeningBalance() != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("openingBalance"), filter.getMaxOpeningBalance()));
            }

            // Booleans
            if (filter.getIsActive() != null) {
                predicates.add(builder.equal(root.get("isActive"), filter.getIsActive()));
            }
            if (filter.getCreatedBy() != null) {
                predicates.add(builder.equal(root.get("createdBy"), filter.getCreatedBy()));
            }
            if (filter.getUpdatedBy() != null) {
                predicates.add(builder.equal(root.get("updatedBy"), filter.getUpdatedBy()));
            }

            // Date Ranges
            if (filter.getCreatedFrom() != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("createdAt"), filter.getCreatedFrom()));
            }
            if (filter.getCreatedTo() != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("createdAt"), filter.getCreatedTo()));
            }
            if (filter.getUpdatedFrom() != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.get("updatedAt"), filter.getUpdatedFrom()));
            }
            if (filter.getUpdatedTo() != null) {
                predicates.add(builder.lessThanOrEqualTo(root.get("updatedAt"), filter.getUpdatedTo()));
            }

            // IDs IN
            if (filter.getIds() != null && !filter.getIds().isEmpty()) {
                predicates.add(root.get("id").in(filter.getIds()));
            }

            return builder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
