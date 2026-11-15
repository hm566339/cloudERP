package com.erp.crm.modules.campaign.service.serviceImpl;

import com.erp.crm.common.exception.ConflictException;
import com.erp.crm.common.exception.ResourceNotFoundException;
import com.erp.crm.common.security.CurrentUserContext;
import com.erp.crm.modules.campaign.dto.*;
import com.erp.crm.modules.campaign.entity.CrmCampaign;
import com.erp.crm.modules.campaign.repository.CrmCampaignRepository;
import com.erp.crm.modules.campaign.service.CrmAttributionService;
import com.erp.crm.modules.campaign.service.CrmCampaignService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrmCampaignServiceImpl implements CrmCampaignService {

    private final CrmCampaignRepository campaignRepository;
    private final CrmAttributionService attributionService;

    @Override
    @Transactional
    public CampaignResponse createCampaign(CampaignRequest request, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);

        campaignRepository.findByCompanyIdAndCampaignCodeAndIsDeletedFalse(effectiveCompanyId, request.getCampaignCode())
                .ifPresent(c -> {
                    throw new ConflictException("Campaign code already exists: " + request.getCampaignCode());
                });

        CrmCampaign campaign = CrmCampaign.builder()
                .campaignCode(request.getCampaignCode().trim().toUpperCase())
                .campaignName(request.getCampaignName())
                .channel(request.getChannel())
                .status(request.getStatus() != null ? request.getStatus().trim().toUpperCase() : "ACTIVE")
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .budgetCurrency(request.getBudgetCurrency() != null ? request.getBudgetCurrency() : "INR")
                .allocatedBudget(request.getAllocatedBudget() != null ? request.getAllocatedBudget() : BigDecimal.ZERO)
                .actualSpend(request.getActualSpend() != null ? request.getActualSpend() : BigDecimal.ZERO)
                .targetLeads(request.getTargetLeads() != null ? request.getTargetLeads() : 0)
                .actualLeadsCount(0)
                .actualConversionsCount(0)
                .actualRevenueWon(BigDecimal.ZERO)
                .utmCampaignParam(request.getUtmCampaignParam())
                .ownerUserId(request.getOwnerUserId())
                .build();
        campaign.setCompanyId(effectiveCompanyId);

        CrmCampaign saved = campaignRepository.save(campaign);
        log.info("Created campaign [{}] for companyId: {}", saved.getCampaignCode(), effectiveCompanyId);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignResponse getCampaignById(UUID id, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        CrmCampaign campaign = campaignRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found: " + id));
        return mapToResponse(campaign);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CampaignResponse> getAllCampaigns(UUID companyId, Pageable pageable) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        return campaignRepository.findByCompanyIdAndIsDeletedFalse(effectiveCompanyId, pageable)
                .map(this::mapToResponse);
    }

    @Override
    @Transactional
    public CampaignResponse updateCampaign(UUID id, CampaignRequest request, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        CrmCampaign campaign = campaignRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found: " + id));

        campaign.setCampaignName(request.getCampaignName());
        campaign.setChannel(request.getChannel());
        if (request.getStatus() != null) {
            campaign.setStatus(request.getStatus().trim().toUpperCase());
        }
        campaign.setStartDate(request.getStartDate());
        campaign.setEndDate(request.getEndDate());
        if (request.getAllocatedBudget() != null) {
            campaign.setAllocatedBudget(request.getAllocatedBudget());
        }
        if (request.getActualSpend() != null) {
            campaign.setActualSpend(request.getActualSpend());
        }
        if (request.getTargetLeads() != null) {
            campaign.setTargetLeads(request.getTargetLeads());
        }
        campaign.setUtmCampaignParam(request.getUtmCampaignParam());
        campaign.setOwnerUserId(request.getOwnerUserId());

        CrmCampaign updated = campaignRepository.save(campaign);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void deleteCampaign(UUID id, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        CrmCampaign campaign = campaignRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found: " + id));
        campaign.setIsDeleted(true);
        campaignRepository.save(campaign);
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignPerformanceResponse getCampaignPerformance(UUID id, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        CrmCampaign campaign = campaignRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Campaign not found: " + id));

        BigDecimal spend = campaign.getActualSpend() != null ? campaign.getActualSpend() : BigDecimal.ZERO;
        BigDecimal revenue = campaign.getActualRevenueWon() != null ? campaign.getActualRevenueWon() : BigDecimal.ZERO;
        int leads = campaign.getActualLeadsCount() != null ? campaign.getActualLeadsCount() : 0;
        int conversions = campaign.getActualConversionsCount() != null ? campaign.getActualConversionsCount() : 0;

        BigDecimal netProfit = revenue.subtract(spend);

        BigDecimal roi = BigDecimal.ZERO;
        if (spend.compareTo(BigDecimal.ZERO) > 0) {
            roi = netProfit.divide(spend, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));
        }

        BigDecimal cpl = BigDecimal.ZERO;
        if (leads > 0 && spend.compareTo(BigDecimal.ZERO) > 0) {
            cpl = spend.divide(BigDecimal.valueOf(leads), 4, RoundingMode.HALF_UP);
        }

        BigDecimal cpa = BigDecimal.ZERO;
        if (conversions > 0 && spend.compareTo(BigDecimal.ZERO) > 0) {
            cpa = spend.divide(BigDecimal.valueOf(conversions), 4, RoundingMode.HALF_UP);
        }

        BigDecimal convRate = BigDecimal.ZERO;
        if (leads > 0) {
            convRate = BigDecimal.valueOf(conversions)
                    .divide(BigDecimal.valueOf(leads), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        return CampaignPerformanceResponse.builder()
                .campaignId(campaign.getId())
                .campaignCode(campaign.getCampaignCode())
                .campaignName(campaign.getCampaignName())
                .allocatedBudget(campaign.getAllocatedBudget())
                .actualSpend(spend)
                .actualLeadsCount(leads)
                .actualConversionsCount(conversions)
                .actualRevenueWon(revenue)
                .netProfit(netProfit)
                .roiPercentage(roi)
                .costPerLead(cpl)
                .costPerAcquisition(cpa)
                .conversionRatePercentage(convRate)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CampaignAttributionResponse getCampaignAttribution(UUID id, UUID companyId) {
        UUID effectiveCompanyId = resolveCompanyId(companyId);
        return attributionService.getCampaignAttribution(effectiveCompanyId, id);
    }

    private UUID resolveCompanyId(UUID explicitCompanyId) {
        return CurrentUserContext.resolveCompanyId(explicitCompanyId);
    }

    private CampaignResponse mapToResponse(CrmCampaign c) {
        return CampaignResponse.builder()
                .id(c.getId())
                .companyId(c.getCompanyId())
                .campaignCode(c.getCampaignCode())
                .campaignName(c.getCampaignName())
                .channel(c.getChannel())
                .status(c.getStatus())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .budgetCurrency(c.getBudgetCurrency())
                .allocatedBudget(c.getAllocatedBudget())
                .actualSpend(c.getActualSpend())
                .targetLeads(c.getTargetLeads())
                .actualLeadsCount(c.getActualLeadsCount())
                .actualConversionsCount(c.getActualConversionsCount())
                .actualRevenueWon(c.getActualRevenueWon())
                .utmCampaignParam(c.getUtmCampaignParam())
                .ownerUserId(c.getOwnerUserId())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}

