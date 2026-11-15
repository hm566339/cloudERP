package com.erp.crm.modules.integration.repository;

import com.erp.crm.modules.integration.entity.CrmIntegrationChannel;
import com.erp.crm.modules.integration.enums.IntegrationProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmIntegrationChannelRepository extends JpaRepository<CrmIntegrationChannel, UUID> {
    Optional<CrmIntegrationChannel> findByProviderCode(IntegrationProvider providerCode);
    List<CrmIntegrationChannel> findByIsActiveTrue();
}

