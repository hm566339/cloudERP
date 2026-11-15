package com.erp.crm.modules.campaign.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignPerformanceResponse {
    private UUID campaignId;
    private String campaignCode;
    private String campaignName;
    private BigDecimal allocatedBudget;
    private BigDecimal actualSpend;
    private Integer actualLeadsCount;
    private Integer actualConversionsCount;
    private BigDecimal actualRevenueWon;
    private BigDecimal netProfit;
    private BigDecimal roiPercentage;
    private BigDecimal costPerLead;
    private BigDecimal costPerAcquisition;
    private BigDecimal conversionRatePercentage;
}

