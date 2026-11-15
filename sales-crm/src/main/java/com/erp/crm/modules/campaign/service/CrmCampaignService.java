package com.erp.crm.modules.campaign.service;

import com.erp.crm.modules.campaign.dto.CampaignAttributionResponse;
import com.erp.crm.modules.campaign.dto.CampaignPerformanceResponse;
import com.erp.crm.modules.campaign.dto.CampaignRequest;
import com.erp.crm.modules.campaign.dto.CampaignResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CrmCampaignService {

    CampaignResponse createCampaign(CampaignRequest request, UUID companyId);
    CampaignResponse getCampaignById(UUID id, UUID companyId);
    Page<CampaignResponse> getAllCampaigns(UUID companyId, Pageable pageable);
    CampaignResponse updateCampaign(UUID id, CampaignRequest request, UUID companyId);
    void deleteCampaign(UUID id, UUID companyId);
    CampaignPerformanceResponse getCampaignPerformance(UUID id, UUID companyId);
    CampaignAttributionResponse getCampaignAttribution(UUID id, UUID companyId);
}

