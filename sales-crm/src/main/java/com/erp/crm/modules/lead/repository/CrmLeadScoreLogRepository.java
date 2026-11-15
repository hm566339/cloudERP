package com.erp.crm.modules.lead.repository;

import com.erp.crm.modules.lead.entity.CrmLeadScoreLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmLeadScoreLogRepository extends JpaRepository<CrmLeadScoreLog, UUID> {
    List<CrmLeadScoreLog> findByCompanyIdAndLeadIdOrderByCreatedAtDesc(UUID companyId, UUID leadId);
}

