package com.erp.auth_service.repository;

import com.erp.auth_service.model.OrganizationRegionalSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRegionalSettingsRepository extends JpaRepository<OrganizationRegionalSettings, UUID> {
    Optional<OrganizationRegionalSettings> findByOrganization_Id(UUID organizationId);
    boolean existsByOrganization_Id(UUID organizationId);
}

