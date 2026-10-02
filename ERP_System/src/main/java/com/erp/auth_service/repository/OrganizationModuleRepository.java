package com.erp.auth_service.repository;

import com.erp.auth_service.model.OrganizationModule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface OrganizationModuleRepository extends JpaRepository<OrganizationModule, UUID> {
    boolean existsByOrganization_IdAndModule_IdAndEnabledTrue(UUID organizationId, UUID moduleId);
    java.util.List<OrganizationModule> findByOrganization_IdAndEnabledTrue(UUID organizationId);
}