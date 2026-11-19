package com.erp.crm.modules.integration.repository;

import com.erp.crm.modules.integration.entity.TenantIntegrationEntity;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantIntegrationEntityRepository extends JpaRepository<TenantIntegrationEntity, UUID> {

    List<TenantIntegrationEntity> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID tenantId);

    Optional<TenantIntegrationEntity> findByIdAndTenantIdAndIsDeletedFalse(UUID id, UUID tenantId);

    Optional<TenantIntegrationEntity> findByWebhookSlugAndIsDeletedFalse(String webhookSlug);

    List<TenantIntegrationEntity> findByTenantIdAndProviderCodeAndIsDeletedFalse(UUID tenantId, IntegrationProviderCode providerCode);
}
