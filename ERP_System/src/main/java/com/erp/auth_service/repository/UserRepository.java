package com.erp.auth_service.repository;

import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.User;
import com.erp.auth_service.utility.AccountStatus;
import com.erp.auth_service.utility.Status;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {

        // ================= BASIC =================

        Optional<User> findByUsername(String username);

        Optional<User> findByEmail(String email);

        boolean existsByEmail(String email);

        boolean existsByUsernameIgnoreCase(String username);

        boolean existsByEmailIgnoreCase(String email);

        Optional<User> findByUsernameAndEmail(String username, String email);

        // ================= LOGIN =================

        @EntityGraph(attributePaths = { "userRoles", "userRoles.role", "company" })
        Optional<User> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);

        @EntityGraph(attributePaths = { "userRoles", "userRoles.role", "company" })
        List<User> findAllByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);

        @Query("""
                            SELECT DISTINCT u FROM User u
                            LEFT JOIN FETCH u.userRoles ur
                            LEFT JOIN FETCH ur.role
                            WHERE LOWER(u.username) = LOWER(:username)
                               OR LOWER(u.email) = LOWER(:email)
                        """)
        Optional<User> findByUsernameIgnoreCaseOrEmailIgnoreCaseWithRoles(
                        @Param("username") String username,
                        @Param("email") String email);

        // ================= CURRENT USER (JWT) =================

        @Query("""
                            SELECT DISTINCT u FROM User u
                            LEFT JOIN FETCH u.userRoles ur
                            LEFT JOIN FETCH ur.role
                            WHERE u.id = :userId
                        """)
        Optional<User> findByIdWithRolesAndPortalAccess(@Param("userId") UUID userId);

        // ================= ONLY ROLES =================

        @Query("""
                            SELECT DISTINCT u FROM User u
                            LEFT JOIN FETCH u.userRoles ur
                            LEFT JOIN FETCH ur.role
                            WHERE u.id = :id
                        """)
        Optional<User> findByIdWithRoles(@Param("id") UUID id);

        // ================= DASHBOARD =================

        long countByAccountStatus(AccountStatus accountStatus);

        long countByEmailStatus(Status emailStatus);

        @Query("""
                            SELECT COUNT(u)
                            FROM User u
                            WHERE u.accountStatus = :status
                               OR (u.lockedUntil IS NOT NULL AND u.lockedUntil > :now)
                        """)
        long countBlockedUsers(
                        @Param("status") AccountStatus status,
                        @Param("now") LocalDateTime now);

        @Query("""
                        SELECT COUNT(u)
                        FROM User u
                        WHERE u.company.id = :companyId
                          AND (
                                u.accountStatus = :blocked
                                OR (u.lockedUntil IS NOT NULL AND u.lockedUntil > :now)
                              )
                        """)
        long countBlockedUsersByCompany(
                        @Param("companyId") UUID companyId,
                        @Param("blocked") AccountStatus blocked,
                        @Param("now") LocalDateTime now);

        boolean existsByCompany_IdAndUsernameIgnoreCase(UUID id, String username);

        boolean existsByCompany_IdAndEmailIgnoreCase(UUID id, String email);

        // Optional<User>
        // findByCompany_IdAndUsernameIgnoreCaseOrEmailIgnoreCaseWithRoles(UUID id,
        // String input,
        // String input2);

        Optional<User> findByCompany_IdAndUsernameIgnoreCaseOrEmailIgnoreCase(UUID id, String input, String input2);

        Optional<User> findByCompany_IdAndEmailIgnoreCase(UUID id, String email);

        @Query("""
                        SELECT DISTINCT u
                        FROM User u
                        LEFT JOIN FETCH u.portalAccesses pa
                        LEFT JOIN FETCH pa.companyModule cm
                        LEFT JOIN FETCH cm.module
                        WHERE u.id = :userId
                        """)
        Optional<User> findByIdWithPortalAccess(@Param("userId") UUID userId);

        @Query("""
                        SELECT DISTINCT u
                        FROM User u
                        JOIN FETCH u.company
                        LEFT JOIN FETCH u.userRoles ur
                        LEFT JOIN FETCH ur.role
                        WHERE u.company.id = :companyId
                        AND (
                            LOWER(u.username) = LOWER(:input)
                            OR LOWER(u.email) = LOWER(:input)
                        )
                        """)
        Optional<User> findUserWithRoles(
                        @Param("companyId") UUID companyId,
                        @Param("input") String input);

        long countByCompanyId(UUID companyId);

        long countByCompanyIdAndAccountStatus(UUID companyId, AccountStatus active);

        long countByCompanyIdAndEmailStatus(UUID companyId, Status unverified);

        Optional<User> findByCompany_IdAndUsernameIgnoreCase(UUID id, String string);

}