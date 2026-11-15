package com.erp.crm.modules.pipeline.repository;

import com.erp.crm.modules.pipeline.entity.CrmOpportunityCompetitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmOpportunityCompetitorRepository extends JpaRepository<CrmOpportunityCompetitor, UUID> {
    List<CrmOpportunityCompetitor> findByCompanyIdAndOpportunityId(UUID companyId, UUID opportunityId);
}

