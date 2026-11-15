package com.erp.crm.modules.lead.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_lead_score_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmLeadScoreLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "lead_id", nullable = false)
    private UUID leadId;

    @Column(name = "rule_code", nullable = false, length = 100)
    private String ruleCode;

    @Column(name = "score_delta", nullable = false)
    private Integer scoreDelta;

    @Column(name = "previous_score", nullable = false)
    private Integer previousScore;

    @Column(name = "new_score", nullable = false)
    private Integer newScore;

    @Column(name = "trigger_event", nullable = false, length = 100)
    private String triggerEvent;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

