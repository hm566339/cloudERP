package com.erp.workflow.entity;

import com.erp.workflow.common.entity.BaseEntity;
import com.erp.workflow.enums.ApproverType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Defines who can approve a specific workflow stage.
 * Supports USER, ROLE, DEPARTMENT, RULE, and DOCUMENT_OWNER types.
 * No hardcoded approver logic — fully configuration-driven.
 */
@Entity
@Table(name = "workflow_approver")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowApprover extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_stage_id", nullable = false)
    private WorkflowStage workflowStage;

    @Enumerated(EnumType.STRING)
    @Column(name = "approver_type", nullable = false, length = 50)
    private ApproverType approverType;

    /** Used when approverType = USER */
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "user_name")
    private String userName;

    /** Used when approverType = ROLE */
    @Column(name = "role_id")
    private UUID roleId;

    @Column(name = "role_name", length = 100)
    private String roleName;

    /** Used when approverType = DEPARTMENT */
    @Column(name = "department_id")
    private UUID departmentId;

    @Column(name = "department_name", length = 100)
    private String departmentName;

    /** Used when approverType = RULE — SpEL or custom expression */
    @Column(name = "rule_expression", columnDefinition = "text")
    private String ruleExpression;

    /** Order of approval in sequential execution */
    @Column(name = "approval_order", nullable = false)
    private Integer approvalOrder = 1;

    /** If true and resolution fails, workflow submission is blocked */
    @Column(name = "is_required", nullable = false)
    private Boolean isRequired = true;

    @Column(name = "can_delegate", nullable = false)
    private Boolean canDelegate = true;
}
