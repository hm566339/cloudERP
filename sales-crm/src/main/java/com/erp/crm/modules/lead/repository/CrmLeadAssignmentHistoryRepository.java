package com.erp.crm.modules.lead.repository;

import com.erp.crm.modules.lead.entity.CrmLeadAssignmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmLeadAssignmentHistoryRepository extends JpaRepository<CrmLeadAssignmentHistory, UUID> {
    List<CrmLeadAssignmentHistory> findByCompanyIdAndLeadIdOrderByCreatedAtDesc(UUID companyId, UUID leadId);
}

