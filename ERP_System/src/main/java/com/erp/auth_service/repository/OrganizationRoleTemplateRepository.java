package com.erp.auth_service.repository;

import com.erp.auth_service.model.OrganizationRoleTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRoleTemplateRepository extends JpaRepository<OrganizationRoleTemplate, UUID> {

    List<OrganizationRoleTemplate> findByOrganization_IdOrderByNameAsc(UUID organizationId);

    List<OrganizationRoleTemplate> findByOrganization_IdAndStatusTrueOrderByNameAsc(UUID organizationId);

    Optional<OrganizationRoleTemplate> findByOrganization_IdAndId(UUID organizationId, UUID id);

    Optional<OrganizationRoleTemplate> findByOrganization_IdAndNameIgnoreCase(UUID organizationId, String name);

    boolean existsByOrganization_IdAndNameIgnoreCase(UUID organizationId, String name);

    long countByOrganization_Id(UUID organizationId);

    @Query("""
        SELECT DISTINCT t FROM OrganizationRoleTemplate t
        LEFT JOIN FETCH t.permissions p
        LEFT JOIN FETCH p.permission fp
        LEFT JOIN FETCH fp.feature
        WHERE t.organization.id = :organizationId
        ORDER BY t.name ASC
    """)
    List<OrganizationRoleTemplate> findAllWithPermissionsByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
        SELECT DISTINCT t FROM OrganizationRoleTemplate t
        LEFT JOIN FETCH t.permissions p
        LEFT JOIN FETCH p.permission fp
        LEFT JOIN FETCH fp.feature
        WHERE t.id = :id AND t.organization.id = :organizationId
    """)
    Optional<OrganizationRoleTemplate> findByIdWithPermissions(@Param("organizationId") UUID organizationId, @Param("id") UUID id);
}

