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
                            JOIN FETCH u.company
                            LEFT JOIN FETCH u.userRoles ur
                            LEFT JOIN FETCH ur.role
                            WHERE LOWER(u.username) = LOWER(:username)
                               OR LOWER(u.email) = LOWER(:email)
                        """)
        List<User> findByUsernameIgnoreCaseOrEmailIgnoreCaseWithRoles(
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
        List<User> findUsersWithRolesByCompany(
                        @Param("companyId") UUID companyId,
                        @Param("input") String input);

        default Optional<User> findUserWithRoles(UUID companyId, String input) {
                List<User> users = findUsersWithRolesByCompany(companyId, input);
                if (users == null || users.isEmpty()) {
                        return Optional.empty();
                }
                if (users.size() == 1) {
                        return Optional.of(users.get(0));
                }
                String norm = input.trim().toLowerCase();
                List<User> emailMatch = users.stream()
                                .filter(u -> u.getEmail() != null && u.getEmail().trim().equalsIgnoreCase(norm))
                                .toList();
                List<User> usernameMatch = users.stream()
                                .filter(u -> u.getUsername() != null && u.getUsername().trim().equalsIgnoreCase(norm))
                                .toList();
                if (emailMatch.size() == 1 && usernameMatch.isEmpty()) {
                        return Optional.of(emailMatch.get(0));
                }
                if (usernameMatch.size() == 1 && emailMatch.isEmpty()) {
                        return Optional.of(usernameMatch.get(0));
                }
                if (input.contains("@") && emailMatch.size() == 1) {
                        return Optional.of(emailMatch.get(0));
                }
                if (!input.contains("@") && usernameMatch.size() == 1) {
                        return Optional.of(usernameMatch.get(0));
                }
                // Ambiguous match across multiple distinct users within the same company
                return Optional.empty();
        }

        long countByCompanyId(UUID companyId);

        long countByCompanyIdAndAccountStatus(UUID companyId, AccountStatus active);

        long countByCompanyIdAndEmailStatus(UUID companyId, Status unverified);

        Optional<User> findByCompany_IdAndUsernameIgnoreCase(UUID id, String string);

}