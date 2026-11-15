package com.erp.crm.modules.pipeline.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_opportunity_competitor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmOpportunityCompetitor {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "opportunity_id", nullable = false)
    private UUID opportunityId;

    @Column(name = "competitor_name", nullable = false, length = 200)
    private String competitorName;

    @Column(name = "strengths", columnDefinition = "text")
    private String strengths;

    @Column(name = "weaknesses", columnDefinition = "text")
    private String weaknesses;

    @Column(name = "pricing_comparison", length = 50)
    private String pricingComparison;

    @Builder.Default
    @Column(name = "threat_level", length = 30)
    private String threatLevel = "MEDIUM";

    @Builder.Default
    @Column(name = "is_winner", nullable = false)
    private Boolean isWinner = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

