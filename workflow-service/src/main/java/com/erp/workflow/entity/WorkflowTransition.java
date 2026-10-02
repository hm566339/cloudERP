package com.erp.workflow.entity;

import com.erp.workflow.common.entity.BaseEntity;
import com.erp.workflow.enums.WorkflowActionType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Defines valid state-machine transitions for a workflow.
 * Configuration-driven — no hardcoded source/target stage logic.
 */
@Entity
@Table(name = "workflow_transition")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTransition extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_definition_id", nullable = false)
    private WorkflowDefinition workflowDefinition;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50)
    private WorkflowActionType actionType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_stage_id")
    private WorkflowStage sourceStage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_stage_id")
    private WorkflowStage targetStage;

    @Column(name = "transition_condition", columnDefinition = "text")
    private String transitionCondition;

    /** Comma-separated role names allowed to execute this transition */
    @Column(name = "allowed_roles", length = 500)
    private String allowedRoles;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}
