package com.erp.crm.modules.integration.repository;

import com.erp.crm.modules.integration.entity.CrmIntegrationWebhookLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmIntegrationWebhookLogRepository extends JpaRepository<CrmIntegrationWebhookLog, UUID> {
    Optional<CrmIntegrationWebhookLog> findByCompanyIdAndIdempotencyHash(UUID companyId, String idempotencyHash);
    boolean existsByCompanyIdAndIdempotencyHash(UUID companyId, String idempotencyHash);
}

