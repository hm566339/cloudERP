package com.erp.workflow.entity;

import com.erp.workflow.common.entity.BaseEntity;
import com.erp.workflow.enums.ApproverType;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Defines approver criteria for an organization workflow template stage.
 * NOTE: Approvers are defined by Role Name / Code or expression, NOT company-specific UUIDs.
 */
@Entity
@Table(name = "org_workflow_template_approver")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrgWorkflowTemplateApprover extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stage_id", nullable = false)
    private OrgWorkflowTemplateStage stage;

    @Enumerated(EnumType.STRING)
    @Column(name = "approver_type", nullable = false, length = 50)
    private ApproverType approverType;

    /** Stored by role name/code across all companies under the organization */
    @Column(name = "role_name", length = 100)
    private String roleName;

    @Column(name = "department_name", length = 100)
    private String departmentName;

    @Column(name = "rule_expression", columnDefinition = "text")
    private String ruleExpression;

    @Builder.Default
    @Column(name = "approval_order", nullable = false)
    private Integer approvalOrder = 1;

    @Builder.Default
    @Column(name = "is_required", nullable = false)
    private Boolean isRequired = true;

    @Builder.Default
    @Column(name = "can_delegate", nullable = false)
    private Boolean canDelegate = true;
}

