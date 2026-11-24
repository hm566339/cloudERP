package com.erp.crm.modules.campaign.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MultiTouchAttributionResponse {
    private String activeModel;
    private BigDecimal totalRevenue;
    private Long totalTouchpoints;
    private List<ChannelAttributionDto> channels;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ChannelAttributionDto {
        private String id;
        private String channel;
        private BigDecimal firstTouch;
        private BigDecimal lastTouch;
        private BigDecimal linear;
        private BigDecimal uShaped;
        private String share;
    }
}
