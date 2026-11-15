package com.erp.crm.modules.lead.repository;

import com.erp.crm.modules.lead.entity.CrmLeadMergeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmLeadMergeHistoryRepository extends JpaRepository<CrmLeadMergeHistory, UUID> {
    List<CrmLeadMergeHistory> findByCompanyIdAndPrimaryLeadIdOrderByCreatedAtDesc(UUID companyId, UUID primaryLeadId);
}

