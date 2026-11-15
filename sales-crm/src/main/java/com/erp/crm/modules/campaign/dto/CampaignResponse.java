package com.erp.crm.modules.campaign.dto;

import com.erp.crm.modules.communication.enums.CommunicationChannel;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignResponse {
    private UUID id;
    private UUID companyId;
    private String campaignCode;
    private String campaignName;
    private CommunicationChannel channel;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String budgetCurrency;
    private BigDecimal allocatedBudget;
    private BigDecimal actualSpend;
    private Integer targetLeads;
    private Integer actualLeadsCount;
    private Integer actualConversionsCount;
    private BigDecimal actualRevenueWon;
    private String utmCampaignParam;
    private UUID ownerUserId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

