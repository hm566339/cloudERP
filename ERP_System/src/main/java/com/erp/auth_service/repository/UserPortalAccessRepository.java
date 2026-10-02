package com.erp.auth_service.repository;

import com.erp.auth_service.dto.response.PortalAccessCountProjection;
import com.erp.auth_service.model.Company;
import com.erp.auth_service.model.UserPortalAccess;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserPortalAccessRepository
                extends JpaRepository<UserPortalAccess, UUID> {

        /*
         * BASIC
         */

        Optional<UserPortalAccess> findByUser_IdAndCompanyModule_Id(
                        UUID userId,
                        UUID companyModuleId);

        List<UserPortalAccess> findAllByUser_Id(UUID userId);

        boolean existsByUser_IdAndCompanyModule_Id(
                        UUID userId,
                        UUID companyModuleId);

        /*
         * HOST ACCESS CHECK
         */

        Optional<UserPortalAccess> findByUser_IdAndCompanyModule_Module_HostAndStatusTrueAndCompanyModule_Module_ModuleStatusTrue(
                        UUID userId,
                        String host);

        /*
         * DEFAULT ACTIVE MODULE
         */

        Optional<UserPortalAccess> findFirstByUser_IdAndStatusTrueOrderByCreatedAtAsc(
                        UUID userId);

        /*
         * FETCH USER + COMPANY MODULE + MODULE
         */

        @Query("""
                            SELECT upa
                            FROM UserPortalAccess upa
                            LEFT JOIN FETCH upa.user u
                            LEFT JOIN FETCH upa.companyModule cm
                            LEFT JOIN FETCH cm.module
                        """)
        List<UserPortalAccess> findAllWithUserAndModule();

        /*
         * DASHBOARD
         */

        long countByStatus(boolean status);

        @Query("""
                            SELECT
                                cm.module.name AS moduleName,
                                COUNT(upa) AS grantedUsers
                            FROM UserPortalAccess upa
                            JOIN upa.companyModule cm
                            WHERE upa.status = true
                            GROUP BY cm.module.id, cm.module.name
                            ORDER BY cm.module.name ASC
                        """)
        List<PortalAccessCountProjection> getPortalAccessCountsByModule();

        /*
         * PAGINATION
         */

        @Query("""
                            SELECT upa
                            FROM UserPortalAccess upa
                            JOIN FETCH upa.user u
                            JOIN FETCH upa.companyModule cm
                            JOIN FETCH cm.module m
                            WHERE (:status IS NULL OR upa.status = :status)
                              AND (
                                    :search IS NULL
                                    OR :search = ''
                                    OR LOWER(u.username)
                                        LIKE LOWER(CONCAT('%', :search, '%'))
                                    OR LOWER(m.name)
                                        LIKE LOWER(CONCAT('%', :search, '%'))
                                    OR LOWER(m.host)
                                        LIKE LOWER(CONCAT('%', :search, '%'))
                              )
                        """)
        Page<UserPortalAccess> findAllWithUserAndCompanyModulePage(
                        @Param("search") String search,
                        @Param("status") Boolean status,
                        Pageable pageable);

        /*
         * ACTIVE ACCESS
         */

        Optional<UserPortalAccess> findByUser_IdAndCompanyModule_IdAndStatusTrue(
                        UUID userId,
                        UUID companyModuleId);

        @Query("""
                            SELECT COUNT(upa)
                            FROM UserPortalAccess upa
                            WHERE upa.companyModule.company.id = :companyId
                        """)
        long countByCompany(
                        @Param("companyId") UUID companyId);

        @Query("""
                            SELECT COUNT(upa)
                            FROM UserPortalAccess upa
                            WHERE upa.companyModule.company.id = :companyId
                            AND upa.status = :status
                        """)
        long countByCompanyAndStatus(
                        @Param("companyId") UUID companyId,
                        @Param("status") boolean status);

        @Query("""
                            SELECT
                                m.name AS moduleName,
                                COUNT(upa.user) AS grantedUsers
                            FROM UserPortalAccess upa
                            JOIN upa.companyModule cm
                            JOIN cm.module m
                            WHERE cm.company.id = :companyId
                            GROUP BY m.name
                        """)
        List<PortalAccessCountProjection> getPortalAccessCountsByModule(
                        @Param("companyId") UUID companyId);

        @Query("""
                        SELECT upa
                        FROM UserPortalAccess upa
                        JOIN FETCH upa.user u
                        JOIN FETCH upa.companyModule cm
                        JOIN FETCH cm.company c
                        JOIN FETCH cm.module m
                        WHERE (:search = '' OR
                               LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR
                               LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))
                          AND (:status IS NULL OR upa.status = :status)
                          AND c.id = :companyId
                        """)
        Page<UserPortalAccess> findAllWithUserAndCompanyModulePage(
                        @Param("companyId") UUID companyId,
                        @Param("search") String search,
                        @Param("status") Boolean status,
                        Pageable pageable);
}