package com.erp.crm.modules.campaign.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.communication.enums.CommunicationChannel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "crm_campaign", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_campaign_company_code", columnNames = {"company_id", "campaign_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmCampaign extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "campaign_code", nullable = false, length = 50)
    private String campaignCode;

    @Column(name = "campaign_name", nullable = false, length = 200)
    private String campaignName;

    @Enumerated(EnumType.STRING)
        @Column(name = "channel")
    private CommunicationChannel channel;

    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "ACTIVE";

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Builder.Default
    @Column(name = "budget_currency", nullable = false, length = 3)
    private String budgetCurrency = "INR";

    @Builder.Default
    @Column(name = "allocated_budget", nullable = false, precision = 19, scale = 4)
    private BigDecimal allocatedBudget = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "actual_spend", nullable = false, precision = 19, scale = 4)
    private BigDecimal actualSpend = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "target_leads")
    private Integer targetLeads = 0;

    @Builder.Default
    @Column(name = "actual_leads_count", nullable = false)
    private Integer actualLeadsCount = 0;

    @Builder.Default
    @Column(name = "actual_conversions_count", nullable = false)
    private Integer actualConversionsCount = 0;

    @Builder.Default
    @Column(name = "actual_revenue_won", nullable = false, precision = 19, scale = 4)
    private BigDecimal actualRevenueWon = BigDecimal.ZERO;

    @Column(name = "utm_campaign_param", length = 100)
    private String utmCampaignParam;

    @Column(name = "owner_user_id")
    private UUID ownerUserId;
}
