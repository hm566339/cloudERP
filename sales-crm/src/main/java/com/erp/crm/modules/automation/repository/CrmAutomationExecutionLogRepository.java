package com.erp.crm.modules.automation.repository;

import com.erp.crm.modules.automation.entity.CrmAutomationExecutionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CrmAutomationExecutionLogRepository extends JpaRepository<CrmAutomationExecutionLog, UUID> {
    Page<CrmAutomationExecutionLog> findByCompanyIdOrderByExecutedAtDesc(UUID companyId, Pageable pageable);
}

