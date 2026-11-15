package com.erp.crm.modules.integration.repository;

import com.erp.crm.modules.integration.entity.CrmTenantIntegration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmTenantIntegrationRepository extends JpaRepository<CrmTenantIntegration, UUID> {
    Optional<CrmTenantIntegration> findByWebhookSlugAndIsDeletedFalse(String webhookSlug);
    Optional<CrmTenantIntegration> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
    List<CrmTenantIntegration> findByCompanyIdAndIsDeletedFalse(UUID companyId);
}

