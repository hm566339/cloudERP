package com.erp.workflow.entity;

import com.erp.workflow.common.entity.BaseEntity;
import com.erp.workflow.enums.WorkflowActionType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * State machine transition within an organization workflow template.
 */
@Entity
@Table(name = "org_workflow_template_transition")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgWorkflowTemplateTransition extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id", nullable = false)
    private OrganizationWorkflowTemplate template;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50)
    private WorkflowActionType actionType;

    @Column(name = "source_stage_code", length = 100)
    private String sourceStageCode;

    @Column(name = "target_stage_code", length = 100)
    private String targetStageCode;

    @Column(name = "transition_condition", columnDefinition = "text")
    private String transitionCondition;

    /** Comma-separated role names allowed to execute this transition */
    @Column(name = "allowed_roles", length = 500)
    private String allowedRoles;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}

