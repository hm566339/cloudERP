package com.erp.crm.modules.pipeline.entity;

import com.erp.crm.common.entity.BaseEntity;
import com.erp.crm.modules.pipeline.enums.OpportunityDealStatus;
import com.erp.crm.modules.pipeline.enums.OpportunityDealType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_opportunity", uniqueConstraints = {
        @UniqueConstraint(name = "uq_crm_opp_company_code", columnNames = {"company_id", "opportunity_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmOpportunity extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "opportunity_code", nullable = false, length = 50)
    private String opportunityCode;

    @Column(name = "opportunity_name", nullable = false, length = 255)
    private String opportunityName;

    @Column(name = "pipeline_id", nullable = false)
    private UUID pipelineId;

    @Column(name = "current_stage_id", nullable = false)
    private UUID currentStageId;

    @Column(name = "account_id")
    private UUID accountId;

    @Column(name = "primary_contact_id")
    private UUID primaryContactId;

    @Column(name = "origin_lead_id")
    private UUID originLeadId;

    @Builder.Default
    @Column(name = "deal_value", nullable = false, precision = 19, scale = 4)
    private BigDecimal dealValue = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "currency", nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "expected_close_date", nullable = false)
    private LocalDate expectedCloseDate;

    @Builder.Default
    @Column(name = "probability_pct", nullable = false)
    private Integer probabilityPct = 10;

    @Builder.Default
    @Column(name = "weighted_value", nullable = false, precision = 19, scale = 4)
    private BigDecimal weightedValue = BigDecimal.ZERO;

    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @Column(name = "assigned_team_id")
    private UUID assignedTeamId;

    @Enumerated(EnumType.STRING)
        @Column(name = "deal_type", nullable = false)
    @Builder.Default
    private OpportunityDealType dealType = OpportunityDealType.NEW_BUSINESS;

    @Enumerated(EnumType.STRING)
        @Column(name = "deal_status", nullable = false)
    @Builder.Default
    private OpportunityDealStatus dealStatus = OpportunityDealStatus.OPEN;

    @Column(name = "won_at")
    private LocalDateTime wonAt;

    @Column(name = "lost_at")
    private LocalDateTime lostAt;

    @Column(name = "lost_reason_id")
    private UUID lostReasonId;

    @Column(name = "lost_notes", columnDefinition = "text")
    private String lostNotes;

    @Column(name = "win_notes", columnDefinition = "text")
    private String winNotes;
}
