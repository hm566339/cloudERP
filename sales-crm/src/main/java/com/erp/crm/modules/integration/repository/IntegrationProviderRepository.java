package com.erp.crm.modules.integration.repository;

import com.erp.crm.modules.integration.entity.IntegrationProviderEntity;
import com.erp.crm.modules.integration.enums.IntegrationProviderCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IntegrationProviderRepository extends JpaRepository<IntegrationProviderEntity, UUID> {

    Optional<IntegrationProviderEntity> findByCode(IntegrationProviderCode code);

    List<IntegrationProviderEntity> findByIsEnabledTrue();

    boolean existsByCode(IntegrationProviderCode code);
}
