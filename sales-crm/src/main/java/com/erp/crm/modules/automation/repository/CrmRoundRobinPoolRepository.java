package com.erp.crm.modules.automation.repository;

import com.erp.crm.modules.automation.entity.CrmRoundRobinPool;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmRoundRobinPoolRepository extends JpaRepository<CrmRoundRobinPool, UUID> {
    List<CrmRoundRobinPool> findByCompanyIdAndIsDeletedFalse(UUID companyId);
    Optional<CrmRoundRobinPool> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
    Optional<CrmRoundRobinPool> findByCompanyIdAndPoolCodeAndIsDeletedFalse(UUID companyId, String poolCode);
}

