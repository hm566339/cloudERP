package com.erp.crm.modules.campaign.entity;

import com.erp.crm.modules.communication.enums.CommunicationChannel;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_lead_attribution")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLeadAttribution {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Column(name = "campaign_id")
    private UUID campaignId;

    @Column(name = "touchpoint_type", nullable = false, length = 50)
    private String touchpointType;

    @Builder.Default
    @Column(name = "touchpoint_timestamp", nullable = false)
    private LocalDateTime touchpointTimestamp = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
        @Column(name = "channel", nullable = false)
    private CommunicationChannel channel;

    @Column(name = "utm_source", length = 100)
    private String utmSource;

    @Column(name = "utm_medium", length = 100)
    private String utmMedium;

    @Column(name = "utm_campaign", length = 100)
    private String utmCampaign;

    @Column(name = "utm_content", length = 100)
    private String utmContent;

    @Builder.Default
    @Column(name = "attribution_weight", nullable = false, precision = 5, scale = 4)
    private BigDecimal attributionWeight = new BigDecimal("1.0000");

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
