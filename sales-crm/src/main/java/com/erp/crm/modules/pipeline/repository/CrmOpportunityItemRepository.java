package com.erp.crm.modules.pipeline.repository;

import com.erp.crm.modules.pipeline.entity.CrmOpportunityItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmOpportunityItemRepository extends JpaRepository<CrmOpportunityItem, UUID> {
    List<CrmOpportunityItem> findByCompanyIdAndOpportunityIdAndIsDeletedFalse(UUID companyId, UUID opportunityId);
}

