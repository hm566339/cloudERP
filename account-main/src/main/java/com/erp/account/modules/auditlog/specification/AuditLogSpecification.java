package com.erp.account.modules.auditlog.specification;

import com.erp.account.modules.auditlog.dto.request.AuditLogFilterDto;
import com.erp.account.modules.auditlog.entity.AuditLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class AuditLogSpecification {

    private AuditLogSpecification() {
        throw new UnsupportedOperationException("Utility class");
    }

    public static Specification<AuditLog> getFilterSpecification(AuditLogFilterDto filter, UUID companyId) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (companyId != null) {
                predicates.add(cb.equal(root.get("company").get("id"), companyId));
            }

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

            if (StringUtils.hasText(filter.getModuleName())) {
                predicates.add(cb.equal(cb.lower(root.get("moduleName")), filter.getModuleName().trim().toLowerCase()));
            }

            if (StringUtils.hasText(filter.getEntityName())) {
                predicates.add(cb.equal(cb.lower(root.get("entityName")), filter.getEntityName().trim().toLowerCase()));
            }

            if (filter.getEntityId() != null) {
                predicates.add(cb.equal(root.get("entityId"), filter.getEntityId()));
            }

            if (StringUtils.hasText(filter.getActionType())) {
                predicates.add(cb.equal(cb.lower(root.get("actionType")), filter.getActionType().trim().toLowerCase()));
            }

            if (filter.getPerformedBy() != null) {
                predicates.add(cb.equal(root.get("performedBy"), filter.getPerformedBy()));
            }

            if (filter.getFromDate() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("performedAt"), filter.getFromDate()));
            }

            if (filter.getToDate() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("performedAt"), filter.getToDate()));
            }

            if (StringUtils.hasText(filter.getIpAddress())) {
                predicates.add(cb.equal(root.get("ipAddress"), filter.getIpAddress().trim()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
