package com.erp.crm.modules.communication.repository;

import com.erp.crm.modules.communication.entity.CrmConsentLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmConsentLogRepository extends JpaRepository<CrmConsentLog, UUID> {
    List<CrmConsentLog> findByCompanyIdAndEntityTypeAndEntityIdOrderByCapturedAtDesc(UUID companyId, String entityType, UUID entityId);
}

