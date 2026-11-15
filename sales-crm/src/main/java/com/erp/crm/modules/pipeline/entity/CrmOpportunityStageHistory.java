package com.erp.crm.modules.pipeline.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_opportunity_stage_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CrmOpportunityStageHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Column(name = "opportunity_id", nullable = false)
    private UUID opportunityId;

    @Column(name = "from_stage_id")
    private UUID fromStageId;

    @Column(name = "to_stage_id", nullable = false)
    private UUID toStageId;

    @CreationTimestamp
    @Column(name = "stage_entry_at", updatable = false)
    private LocalDateTime stageEntryAt;

    @Column(name = "stage_exit_at")
    private LocalDateTime stageExitAt;

    @Column(name = "duration_seconds")
    private Long durationSeconds;

    @Column(name = "changed_by_user_id", nullable = false)
    private UUID changedByUserId;

    @Column(name = "reason_for_change", columnDefinition = "text")
    private String reasonForChange;
}

