package com.erp.workflow.entity;

import com.erp.workflow.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * SLA settings for an organization workflow template stage.
 */
@Entity
@Table(name = "org_workflow_template_sla")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgWorkflowTemplateSla extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private OrgWorkflowTemplateStage stage;

    @Column(name = "duration_hours", nullable = false)
    private Integer durationHours;

    @Column(name = "reminder_hours")
    private Integer reminderHours;

    @Builder.Default
    @Column(name = "escalation_action", length = 100)
    private String escalationAction = "NOTIFY_MANAGER";

    @Column(name = "escalate_to_role_name", length = 100)
    private String escalateToRoleName;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}

