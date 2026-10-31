package com.erp.auth_service.repository;

import com.erp.auth_service.model.OrganizationModule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationModuleRepository extends JpaRepository<OrganizationModule, UUID> {
    boolean existsByOrganization_IdAndModule_IdAndEnabledTrue(UUID organizationId, UUID moduleId);

    List<OrganizationModule> findByOrganization_IdAndEnabledTrue(UUID organizationId);

    List<OrganizationModule> findByOrganization_Id(UUID organizationId);

    Optional<OrganizationModule> findByOrganization_IdAndModule_Id(UUID organizationId, UUID moduleId);

    Optional<OrganizationModule> findByOrganization_IdAndModule_NameIgnoreCase(UUID organizationId, String moduleName);
}
