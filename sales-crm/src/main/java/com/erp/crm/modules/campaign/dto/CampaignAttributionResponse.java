package com.erp.crm.modules.campaign.dto;

import com.erp.crm.modules.communication.enums.CommunicationChannel;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignAttributionResponse {
    private UUID campaignId;
    private Integer totalTouchpoints;
    private Integer firstTouchCount;
    private Integer lastTouchCount;
    private BigDecimal totalAttributedRevenue;
    private List<AttributionTouchpointDto> touchpoints;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttributionTouchpointDto {
        private UUID id;
        private UUID leadId;
        private UUID campaignId;
        private String touchpointType;
        private LocalDateTime touchpointTimestamp;
        private CommunicationChannel channel;
        private String utmSource;
        private String utmMedium;
        private String utmCampaign;
        private BigDecimal attributionWeight;
    }
}

