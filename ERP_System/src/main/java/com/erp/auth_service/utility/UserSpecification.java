package com.erp.auth_service.utility;

import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.User;
import com.erp.auth_service.model.UserRole;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;

import java.util.UUID;

import org.springframework.data.jpa.domain.Specification;

public class UserSpecification {

    public static Specification<User> hasSearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }

            String keyword = "%" + search.trim().toLowerCase() + "%";

            return cb.or(
                    cb.like(cb.lower(root.get("username")), keyword),
                    cb.like(cb.lower(root.get("email")), keyword),
                    cb.like(cb.lower(root.get("fullName")), keyword),
                    cb.like(cb.lower(root.get("empId")), keyword));
        };
    }

    public static Specification<User> hasStatus(AccountStatus status) {
        return (root, query, cb) -> {
            if (status == null) {
                return cb.conjunction();
            }

            return cb.equal(root.get("accountStatus"), status);
        };
    }

    public static Specification<User> hasRole(String role) {
        return (root, query, cb) -> {
            if (role == null || role.isBlank()) {
                return cb.conjunction();
            }

            query.distinct(true);

            Join<User, UserRole> userRoleJoin = root.join("userRoles", JoinType.INNER);

            Join<UserRole, Role> roleJoin = userRoleJoin.join("role", JoinType.INNER);

            return cb.equal(
                    cb.lower(roleJoin.get("name")),
                    role.trim().toLowerCase());
        };
    }

    public static Specification<User> hasCompany(
            UUID companyId) {

        return (root, query, cb) -> {

            if (companyId == null) {
                return cb.conjunction();
            }

            query.distinct(true);

            var primaryCompanyMatch = cb.equal(
                    root.get("company").get("id"),
                    companyId);

            var subquery = query.subquery(UUID.class);
            var mcaRoot = subquery.from(com.erp.auth_service.model.MemberCompanyAccess.class);
            subquery.select(mcaRoot.get("organizationMember").get("user").get("id"))
                    .where(
                            cb.equal(mcaRoot.get("company").get("id"), companyId),
                            cb.isTrue(mcaRoot.get("active")));

            var memberAccessMatch = cb.in(root.get("id")).value(subquery);

            return cb.or(primaryCompanyMatch, memberAccessMatch);
        };
    }
}