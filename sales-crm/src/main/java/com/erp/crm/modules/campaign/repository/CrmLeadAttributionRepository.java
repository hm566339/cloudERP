package com.erp.crm.modules.campaign.repository;

import com.erp.crm.modules.campaign.entity.CrmLeadAttribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CrmLeadAttributionRepository extends JpaRepository<CrmLeadAttribution, UUID> {
    List<CrmLeadAttribution> findByCompanyIdAndLeadIdOrderByTouchpointTimestampAsc(UUID companyId, UUID leadId);
    List<CrmLeadAttribution> findByCompanyIdAndCampaignId(UUID companyId, UUID campaignId);
    List<CrmLeadAttribution> findByCompanyIdOrderByTouchpointTimestampAsc(UUID companyId);
    List<CrmLeadAttribution> findByCompanyId(UUID companyId);
}

