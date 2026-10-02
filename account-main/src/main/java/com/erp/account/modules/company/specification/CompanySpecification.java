package com.erp.account.modules.company.specification;

import com.erp.account.modules.company.dto.request.CompanyFilterDto;
import com.erp.account.modules.company.entity.Company;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class CompanySpecification {

    private CompanySpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<Company> getFilterSpecification(CompanyFilterDto filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

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

            if (StringUtils.hasText(filter.getSearchKey())) {
                String searchPattern = "%" + filter.getSearchKey().trim().toLowerCase() + "%";
                Predicate codeMatch = cb.like(cb.lower(root.get("companyCode")), searchPattern);
                Predicate nameMatch = cb.like(cb.lower(root.get("companyName")), searchPattern);
                Predicate gstinMatch = cb.like(cb.lower(root.get("gstin")), searchPattern);
                Predicate emailMatch = cb.like(cb.lower(root.get("email")), searchPattern);
                Predicate phoneMatch = cb.like(cb.lower(root.get("phone")), searchPattern);
                predicates.add(cb.or(codeMatch, nameMatch, gstinMatch, emailMatch, phoneMatch));
            }

            if (StringUtils.hasText(filter.getCompanyCode())) {
                predicates.add(cb.equal(cb.lower(root.get("companyCode")), filter.getCompanyCode().trim().toLowerCase()));
            }

            if (StringUtils.hasText(filter.getBaseCurrency())) {
                predicates.add(cb.equal(cb.lower(root.get("baseCurrency")), filter.getBaseCurrency().trim().toLowerCase()));
            }

            if (filter.getActive() != null) {
                predicates.add(cb.equal(root.get("active"), filter.getActive()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
