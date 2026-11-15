package com.erp.crm.modules.campaign.repository;

import com.erp.crm.modules.campaign.entity.CrmCampaign;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CrmCampaignRepository extends JpaRepository<CrmCampaign, UUID> {
    Optional<CrmCampaign> findByCompanyIdAndIdAndIsDeletedFalse(UUID companyId, UUID id);
    Optional<CrmCampaign> findByCompanyIdAndCampaignCodeAndIsDeletedFalse(UUID companyId, String campaignCode);
    Page<CrmCampaign> findByCompanyIdAndIsDeletedFalse(UUID companyId, Pageable pageable);
}

