package com.erp.workflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/** SLA configuration for a workflow stage. */
@Entity
@Table(name = "workflow_sla")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowSla {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_stage_id", nullable = false)
    private WorkflowStage workflowStage;

    /** Total SLA window in hours */
    @Column(name = "duration_hours", nullable = false)
    private Integer durationHours;

    /** Hours before deadline to send reminder */
    @Column(name = "reminder_hours")
    private Integer reminderHours;

    @Column(name = "escalation_action", nullable = false, length = 50)
    private String escalationAction = "NOTIFY_MANAGER";

    @Column(name = "escalate_to_user_id")
    private UUID escalateToUserId;

    @Column(name = "escalate_to_role_name", length = 100)
    private String escalateToRoleName;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}
