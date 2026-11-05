package com.erp.auth_service.repository;

import com.erp.auth_service.dto.response.RoleCountProjection;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.Role;
import com.erp.auth_service.model.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoleRepository extends JpaRepository<Role, UUID> {

        boolean existsByNameIgnoreCase(String name);

        Optional<Role> findByNameIgnoreCase(String name);

        List<Role> findByStatus(boolean status);

        @Query("""
                        SELECT DISTINCT r FROM Role r
                        LEFT JOIN FETCH r.userRoles ur
                        LEFT JOIN FETCH ur.user
                        WHERE r.id = :id
                        """)
        Optional<Role> findByIdWithUsers(@Param("id") UUID id);

        Optional<Role> findByName(String string);

        @Query("""
                            SELECT r.name AS roleName,
                                   COUNT(DISTINCT u.id) AS assignedUsers
                            FROM Role r
                            LEFT JOIN r.userRoles ur
                            LEFT JOIN ur.user u
                            GROUP BY r.id, r.name
                            ORDER BY r.name ASC
                        """)
        List<RoleCountProjection> getRoleAssignmentCounts();

        @Query("""
                            SELECT r FROM Role r
                            WHERE LOWER(r.name) <> LOWER('SYSTEM_ADMIN')
                              AND (:status IS NULL OR r.status = :status)
                              AND (
                                    :search IS NULL
                                    OR :search = ''
                                    OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                              )
                        """)
        Page<Role> findAllWithFilters(
                        @Param("status") Boolean status,
                        @Param("search") String search,
                        Pageable pageable);

        Optional<Role> findByCompany_IdAndNameIgnoreCase(UUID id, String string);

        boolean existsByCompany_IdAndNameIgnoreCase(UUID id, String newName);

        @Query("""
                        SELECT r FROM Role r
                        WHERE (:companyId IS NULL OR r.company.id = :companyId)
                        AND (:status IS NULL OR r.status = :status)
                        AND (
                            :keyword IS NULL OR
                            LOWER(r.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                        )
                        """)
        Page<Role> findAllWithFilters(
                        @Param("companyId") UUID companyId,
                        @Param("status") Boolean status,
                        @Param("keyword") String keyword,
                        Pageable pageable);

        long countByCompanyId(UUID companyId);

        @Query("""
                            SELECT
                                r.name AS roleName,
                                COUNT(ur.user) AS assignedUsers
                            FROM UserRole ur
                            JOIN ur.role r
                            WHERE r.company.id = :companyId
                            GROUP BY r.name
                        """)
        List<RoleCountProjection> getRoleAssignmentCounts(
                        @Param("companyId") UUID companyId);

        List<Role> findByTemplate_Id(UUID templateId);

        long countByTemplate_Id(UUID templateId);

        List<Role> findByCompany_Organization_IdAndNameIgnoreCase(UUID organizationId, String name);

        List<Role> findByCompany_Organization_Id(UUID organizationId);

}