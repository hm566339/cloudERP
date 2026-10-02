package com.erp.auth_service.repository;

import com.erp.auth_service.model.Module;

import io.jsonwebtoken.security.Jwks.OP;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ModuleRepository
        extends JpaRepository<Module, UUID> {

    /*
     * EXISTS
     */
    boolean existsByNameIgnoreCase(String name);

    boolean existsByHostIgnoreCase(String host);

    /*
     * FINDERS
     */
    List<Module> findByModuleStatus(boolean moduleStatus);

    Optional<Module> findByHost(String host);

    Optional<Module> findByClientId(UUID clientId);

    Optional<Module> findByName(String name);

    /*
     * ACTIVE HOSTS
     */
    @Query("""
                SELECT DISTINCT m.host
                FROM Module m
                WHERE m.host IS NOT NULL
                  AND m.moduleStatus = true
            """)
    List<String> findAllActiveHosts();

    /*
     * GLOBAL COUNTS
     */
    long countByModuleStatus(boolean moduleStatus);

    /*
     * PAGINATION
     */
    Page<Module> findByModuleStatus(
            Boolean moduleStatus,
            Pageable pageable);

    /*
     * FILTERS
     */
    @Query("""
                SELECT m
                FROM Module m
                WHERE (:status IS NULL OR m.moduleStatus = :status)
                  AND (
                        :search IS NULL
                        OR :search = ''
                        OR LOWER(m.name)
                            LIKE LOWER(CONCAT('%', :search, '%'))
                        OR LOWER(m.host)
                            LIKE LOWER(CONCAT('%', :search, '%'))
                        OR LOWER(CAST(m.clientId AS string))
                            LIKE LOWER(CONCAT('%', :search, '%'))
                  )
            """)
    Page<Module> findAllWithFilters(
            @Param("status") Boolean status,
            @Param("search") String search,
            Pageable pageable);

    /*
     * COMPANY MODULE COUNTS
     *
     * IMPORTANT:
     * Module entity does NOT contain company directly.
     *
     * Relation:
     * Company -> CompanyModule -> Module
     */

    @Query("""
                SELECT COUNT(cm)
                FROM CompanyModule cm
                WHERE cm.company.id = :companyId
            """)
    long countModulesByCompany(
            @Param("companyId") UUID companyId);

    @Query("""
                SELECT COUNT(cm)
                FROM CompanyModule cm
                WHERE cm.company.id = :companyId
                  AND cm.active = true
            """)
    long countActiveModulesByCompany(
            @Param("companyId") UUID companyId);

    @Query("""
                SELECT COUNT(cm)
                FROM CompanyModule cm
                WHERE cm.company.id = :companyId
                  AND cm.active = false
            """)
    long countInactiveModulesByCompany(
            @Param("companyId") UUID companyId);

    Optional<Module> findByNameIgnoreCase(String string);
}