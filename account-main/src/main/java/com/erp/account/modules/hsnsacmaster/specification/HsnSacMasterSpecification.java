package com.erp.account.modules.hsnsacmaster.specification;

import com.erp.account.modules.hsnsacmaster.dto.request.HsnSacMasterFilterDto;
import com.erp.account.modules.hsnsacmaster.entity.HsnSacMaster;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class HsnSacMasterSpecification {

    private HsnSacMasterSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<HsnSacMaster> getFilterSpecification(HsnSacMasterFilterDto filter) {
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
                Predicate codeMatch = cb.like(cb.lower(root.get("code")), searchPattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), searchPattern);
                predicates.add(cb.or(codeMatch, descMatch));
            }

            if (StringUtils.hasText(filter.getCode())) {
                predicates.add(cb.equal(cb.lower(root.get("code")), filter.getCode().trim().toLowerCase()));
            }

            if (StringUtils.hasText(filter.getType())) {
                predicates.add(cb.equal(root.get("type"), filter.getType().trim().toUpperCase()));
            }
            
            if (filter.getGstSlabId() != null) {
                predicates.add(cb.equal(root.get("gstSlab").get("id"), filter.getGstSlabId()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
