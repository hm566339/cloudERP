package com.erp.crm.modules.campaign.service;

import com.erp.crm.modules.campaign.dto.CampaignAttributionResponse;
import com.erp.crm.modules.campaign.entity.CrmCampaign;
import com.erp.crm.modules.campaign.entity.CrmLeadAttribution;
import com.erp.crm.modules.campaign.repository.CrmCampaignRepository;
import com.erp.crm.modules.campaign.repository.CrmLeadAttributionRepository;
import com.erp.crm.modules.communication.enums.CommunicationChannel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrmAttributionService {

    private final CrmLeadAttributionRepository attributionRepository;
    private final CrmCampaignRepository campaignRepository;

    @Transactional
    public CrmLeadAttribution recordTouchpoint(UUID companyId, UUID leadId, UUID campaignId,
                                                String touchpointType, CommunicationChannel channel,
                                                String utmSource, String utmMedium, String utmCampaign, String utmContent) {
        CrmLeadAttribution attribution = CrmLeadAttribution.builder()
                .companyId(companyId)
                .leadId(leadId)
                .campaignId(campaignId)
                .touchpointType(touchpointType != null ? touchpointType : "WEBSITE_VISIT")
                .touchpointTimestamp(LocalDateTime.now())
                .channel(channel != null ? channel : CommunicationChannel.WEB_CHAT)
                .utmSource(utmSource)
                .utmMedium(utmMedium)
                .utmCampaign(utmCampaign)
                .utmContent(utmContent)
                .attributionWeight(BigDecimal.ONE)
                .build();

        CrmLeadAttribution saved = attributionRepository.save(attribution);
        log.info("Recorded attribution touchpoint [{}] for lead [{}] company [{}]", touchpointType, leadId, companyId);
        return saved;
    }

    @Transactional(readOnly = true)
    public CampaignAttributionResponse getCampaignAttribution(UUID companyId, UUID campaignId) {
        List<CrmLeadAttribution> touchpoints = attributionRepository.findByCompanyIdAndCampaignId(companyId, campaignId);
        Optional<CrmCampaign> campaignOpt = campaignRepository.findByCompanyIdAndIdAndIsDeletedFalse(companyId, campaignId);

        BigDecimal campaignRevenue = campaignOpt.map(CrmCampaign::getActualRevenueWon).orElse(BigDecimal.ZERO);

        int firstTouchCount = 0;
        int lastTouchCount = 0;
        BigDecimal totalAttributedWeight = BigDecimal.ZERO;

        List<CampaignAttributionResponse.AttributionTouchpointDto> dtos = new ArrayList<>();
        for (CrmLeadAttribution t : touchpoints) {
            if ("FIRST_TOUCH".equalsIgnoreCase(t.getTouchpointType())) {
                firstTouchCount++;
            } else if ("LAST_TOUCH".equalsIgnoreCase(t.getTouchpointType()) || "CONVERSION".equalsIgnoreCase(t.getTouchpointType())) {
                lastTouchCount++;
            }

            BigDecimal weight = t.getAttributionWeight() != null ? t.getAttributionWeight() : BigDecimal.ONE;
            totalAttributedWeight = totalAttributedWeight.add(weight);

            dtos.add(CampaignAttributionResponse.AttributionTouchpointDto.builder()
                    .id(t.getId())
                    .leadId(t.getLeadId())
                    .campaignId(t.getCampaignId())
                    .touchpointType(t.getTouchpointType())
                    .touchpointTimestamp(t.getTouchpointTimestamp())
                    .channel(t.getChannel())
                    .utmSource(t.getUtmSource())
                    .utmMedium(t.getUtmMedium())
                    .utmCampaign(t.getUtmCampaign())
                    .attributionWeight(weight)
                    .build());
        }

        // Avoid double-counting: total attributed revenue is capped at campaign actual revenue won
        BigDecimal totalAttributedRevenue = campaignRevenue;

        return CampaignAttributionResponse.builder()
                .campaignId(campaignId)
                .totalTouchpoints(touchpoints.size())
                .firstTouchCount(firstTouchCount)
                .lastTouchCount(lastTouchCount)
                .totalAttributedRevenue(totalAttributedRevenue)
                .touchpoints(dtos)
                .build();
    }
}
