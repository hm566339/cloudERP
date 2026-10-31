package com.erp.auth_service.repository;

import com.erp.auth_service.model.OrganizationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationSettingsRepository extends JpaRepository<OrganizationSettings, UUID> {

    Optional<OrganizationSettings> findByOrganization_Id(UUID organizationId);

    boolean existsByOrganization_Id(UUID organizationId);

    void deleteByOrganization_Id(UUID organizationId);
}

