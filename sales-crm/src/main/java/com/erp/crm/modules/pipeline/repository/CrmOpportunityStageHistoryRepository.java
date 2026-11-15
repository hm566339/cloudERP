package com.erp.crm.modules.pipeline.repository;

import com.erp.crm.modules.pipeline.entity.CrmOpportunityStageHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmOpportunityStageHistoryRepository extends JpaRepository<CrmOpportunityStageHistory, UUID> {
    List<CrmOpportunityStageHistory> findByCompanyIdAndOpportunityIdOrderByStageEntryAtAsc(UUID companyId, UUID opportunityId);
}

