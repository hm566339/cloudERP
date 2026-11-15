package com.erp.crm.modules.dashboard.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmDashboardSummaryResponse {

    private long totalLeads;
    private long convertedLeads;
    private long lostLeads;
    private double leadConversionRatePct;

    private long totalOpenDeals;
    private long totalWonDeals;
    private long totalLostDeals;
    private BigDecimal openPipelineValue;
    private BigDecimal wonRevenue;

    private long totalDraftQuotes;
    private long pendingApprovalQuotes;
    private long convertedQuotes;
    private BigDecimal convertedQuotesValue;
}

