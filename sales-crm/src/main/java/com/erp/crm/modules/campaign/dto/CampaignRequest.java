package com.erp.crm.modules.campaign.dto;

import com.erp.crm.modules.communication.enums.CommunicationChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CampaignRequest {

    @NotBlank(message = "Campaign code is required")
    private String campaignCode;

    @NotBlank(message = "Campaign name is required")
    private String campaignName;

    private CommunicationChannel channel;

    @Builder.Default
    private String status = "ACTIVE";

    @NotNull(message = "Start date is required")
    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default
    private String budgetCurrency = "INR";

    @Builder.Default
    private BigDecimal allocatedBudget = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal actualSpend = BigDecimal.ZERO;

    @Builder.Default
    private Integer targetLeads = 0;

    private String utmCampaignParam;

    private UUID ownerUserId;
}

