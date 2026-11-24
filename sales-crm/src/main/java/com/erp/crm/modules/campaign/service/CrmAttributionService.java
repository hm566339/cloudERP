package com.erp.crm.modules.campaign.service;

import com.erp.crm.common.security.CurrentUserContext;
import com.erp.crm.modules.campaign.dto.CampaignAttributionResponse;
import com.erp.crm.modules.campaign.dto.MultiTouchAttributionResponse;
import com.erp.crm.modules.campaign.dto.MultiTouchAttributionResponse.ChannelAttributionDto;
import com.erp.crm.modules.campaign.entity.CrmCampaign;
import com.erp.crm.modules.campaign.entity.CrmLeadAttribution;
import com.erp.crm.modules.campaign.repository.CrmCampaignRepository;
import com.erp.crm.modules.campaign.repository.CrmLeadAttributionRepository;
import com.erp.crm.modules.communication.enums.CommunicationChannel;
import com.erp.crm.modules.lead.entity.CrmLead;
import com.erp.crm.modules.lead.repository.CrmLeadRepository;
import com.erp.crm.modules.pipeline.entity.CrmOpportunity;
import com.erp.crm.modules.pipeline.enums.OpportunityDealStatus;
import com.erp.crm.modules.pipeline.repository.CrmOpportunityRepository;
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
    private final CrmOpportunityRepository opportunityRepository;
    private final CrmLeadRepository leadRepository;

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

    @Transactional(readOnly = true)
    public MultiTouchAttributionResponse getMultiTouchAttributionOverview(UUID companyId, String requestedModel) {
        UUID effectiveCompanyId = CurrentUserContext.resolveCompanyId(companyId);
        String activeModel = (requestedModel != null && !requestedModel.isBlank()) ? requestedModel.trim().toUpperCase() : "U_SHAPED";

        List<CrmOpportunity> opportunities = opportunityRepository.findByCompanyIdAndIsDeletedFalse(effectiveCompanyId);
        List<CrmLeadAttribution> allTouchpoints = attributionRepository.findByCompanyIdOrderByTouchpointTimestampAsc(effectiveCompanyId);

        // Group touchpoints by leadId
        Map<UUID, List<CrmLeadAttribution>> touchpointsByLead = new HashMap<>();
        for (CrmLeadAttribution tp : allTouchpoints) {
            if (tp.getLeadId() != null) {
                touchpointsByLead.computeIfAbsent(tp.getLeadId(), k -> new ArrayList<>()).add(tp);
            }
        }

        // Channels accumulator: channelName -> [firstTouch, lastTouch, linear, uShaped]
        Map<String, BigDecimal[]> channelTotals = new LinkedHashMap<>();

        // Standard ordered baseline channels
        List<String> defaultChannels = List.of(
                "IndiaMART Portal",
                "Google Search Ads",
                "Meta / Instagram B2B",
                "Direct Inbound / Organic",
                "Trade Show / Expo 2026"
        );
        for (String ch : defaultChannels) {
            channelTotals.put(ch, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
        }

        // Identify opportunities to attribute: prefer WON deals, fall back to any active deals with dealValue > 0
        List<CrmOpportunity> targetOpps = opportunities.stream()
                .filter(o -> o.getDealStatus() == OpportunityDealStatus.WON && o.getDealValue() != null && o.getDealValue().compareTo(BigDecimal.ZERO) > 0)
                .toList();

        if (targetOpps.isEmpty()) {
            targetOpps = opportunities.stream()
                    .filter(o -> o.getDealValue() != null && o.getDealValue().compareTo(BigDecimal.ZERO) > 0)
                    .toList();
        }

        BigDecimal totalRevenue = BigDecimal.ZERO;

        for (CrmOpportunity opp : targetOpps) {
            BigDecimal dealVal = opp.getDealValue();
            totalRevenue = totalRevenue.add(dealVal);

            List<String> dealChannels = new ArrayList<>();
            if (opp.getOriginLeadId() != null) {
                List<CrmLeadAttribution> leadTps = touchpointsByLead.get(opp.getOriginLeadId());
                if (leadTps != null && !leadTps.isEmpty()) {
                    for (CrmLeadAttribution tp : leadTps) {
                        dealChannels.add(normalizeChannelName(
                                tp.getChannel() != null ? tp.getChannel().name() : null,
                                tp.getUtmSource(),
                                tp.getUtmMedium(),
                                tp.getTouchpointType()
                        ));
                    }
                } else {
                    leadRepository.findByCompanyIdAndIdAndIsDeletedFalse(effectiveCompanyId, opp.getOriginLeadId())
                            .ifPresent(lead -> dealChannels.add(normalizeChannelName(
                                    null,
                                    lead.getUtmSource(),
                                    lead.getUtmMedium(),
                                    lead.getRawInquiryText()
                            )));
                }
            }

            if (dealChannels.isEmpty()) {
                dealChannels.add("Direct Inbound / Organic");
            }

            int n = dealChannels.size();

            // 1. First Touch: 100% to first touchpoint
            String firstChannel = dealChannels.get(0);
            accumulate(channelTotals, firstChannel, 0, dealVal);

            // 2. Last Touch: 100% to last touchpoint
            String lastChannel = dealChannels.get(n - 1);
            accumulate(channelTotals, lastChannel, 1, dealVal);

            // 3. Linear: equal split across all touchpoints
            BigDecimal linearSlice = dealVal.divide(BigDecimal.valueOf(n), 4, RoundingMode.HALF_UP);
            for (String ch : dealChannels) {
                accumulate(channelTotals, ch, 2, linearSlice);
            }

            // 4. U-Shaped: 40% First, 40% Last, 20% Middle (or 50/50 if 2, 100% if 1)
            if (n == 1) {
                accumulate(channelTotals, firstChannel, 3, dealVal);
            } else if (n == 2) {
                BigDecimal half = dealVal.multiply(new BigDecimal("0.5000"));
                accumulate(channelTotals, firstChannel, 3, half);
                accumulate(channelTotals, lastChannel, 3, half);
            } else {
                BigDecimal firstShare = dealVal.multiply(new BigDecimal("0.4000"));
                BigDecimal lastShare = dealVal.multiply(new BigDecimal("0.4000"));
                BigDecimal middleTotal = dealVal.multiply(new BigDecimal("0.2000"));
                BigDecimal middleSlice = middleTotal.divide(BigDecimal.valueOf(n - 2), 4, RoundingMode.HALF_UP);

                accumulate(channelTotals, firstChannel, 3, firstShare);
                accumulate(channelTotals, lastChannel, 3, lastShare);
                for (int i = 1; i < n - 1; i++) {
                    accumulate(channelTotals, dealChannels.get(i), 3, middleSlice);
                }
            }
        }

        // Calculate total for active model to determine percentage shares
        int modelIdx = switch (activeModel) {
            case "FIRST_TOUCH" -> 0;
            case "LAST_TOUCH" -> 1;
            case "LINEAR" -> 2;
            default -> 3; // U_SHAPED
        };

        BigDecimal activeModelTotal = BigDecimal.ZERO;
        for (BigDecimal[] vals : channelTotals.values()) {
            activeModelTotal = activeModelTotal.add(vals[modelIdx]);
        }

        int idCounter = 1;
        List<ChannelAttributionDto> channelDtos = new ArrayList<>();
        for (Map.Entry<String, BigDecimal[]> entry : channelTotals.entrySet()) {
            BigDecimal[] vals = entry.getValue();
            BigDecimal modelVal = vals[modelIdx];

            String shareStr = "0%";
            if (activeModelTotal.compareTo(BigDecimal.ZERO) > 0 && modelVal.compareTo(BigDecimal.ZERO) > 0) {
                long pct = Math.round(modelVal.divide(activeModelTotal, 4, RoundingMode.HALF_UP).doubleValue() * 100.0);
                shareStr = pct + "%";
            }

            channelDtos.add(ChannelAttributionDto.builder()
                    .id(String.valueOf(idCounter++))
                    .channel(entry.getKey())
                    .firstTouch(vals[0].setScale(0, RoundingMode.HALF_UP))
                    .lastTouch(vals[1].setScale(0, RoundingMode.HALF_UP))
                    .linear(vals[2].setScale(0, RoundingMode.HALF_UP))
                    .uShaped(vals[3].setScale(0, RoundingMode.HALF_UP))
                    .share(shareStr)
                    .build());
        }

        return MultiTouchAttributionResponse.builder()
                .activeModel(activeModel)
                .totalRevenue(totalRevenue.setScale(0, RoundingMode.HALF_UP))
                .totalTouchpoints((long) allTouchpoints.size())
                .channels(channelDtos)
                .build();
    }

    private void accumulate(Map<String, BigDecimal[]> channelTotals, String channel, int index, BigDecimal amount) {
        BigDecimal[] vals = channelTotals.computeIfAbsent(channel, k -> new BigDecimal[]{
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        });
        vals[index] = vals[index].add(amount);
    }

    private String normalizeChannelName(String rawChannel, String utmSource, String utmMedium, String context) {
        String combined = ((rawChannel != null ? rawChannel : "") + " " +
                (utmSource != null ? utmSource : "") + " " +
                (utmMedium != null ? utmMedium : "") + " " +
                (context != null ? context : "")).toLowerCase();

        if (combined.contains("indiamart")) {
            return "IndiaMART Portal";
        } else if (combined.contains("google") || combined.contains("adwords") || combined.contains("cpc") || combined.contains("search")) {
            return "Google Search Ads";
        } else if (combined.contains("meta") || combined.contains("facebook") || combined.contains("instagram") || combined.contains("fb")) {
            return "Meta / Instagram B2B";
        } else if (combined.contains("trade") || combined.contains("expo") || combined.contains("fair") || combined.contains("event")) {
            return "Trade Show / Expo 2026";
        } else if (combined.contains("direct") || combined.contains("organic") || combined.contains("inbound") || combined.contains("website")) {
            return "Direct Inbound / Organic";
        } else if (utmSource != null && !utmSource.isBlank()) {
            return utmSource.trim();
        } else if (rawChannel != null && !rawChannel.isBlank()) {
            return rawChannel.trim();
        }
        return "Direct Inbound / Organic";
    }
}
