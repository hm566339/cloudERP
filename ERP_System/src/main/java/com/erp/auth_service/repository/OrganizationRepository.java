package com.erp.auth_service.repository;

import com.erp.auth_service.model.Organization;
import com.erp.auth_service.utility.OrganizationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {
    Optional<Organization> findByOrganizationCodeIgnoreCaseAndStatusNot(String code, OrganizationStatus status);
    boolean existsByOrganizationCodeIgnoreCase(String code);

    long countByStatus(OrganizationStatus status);
    long countByAccessMode(com.erp.auth_service.utility.AccessMode accessMode);
}