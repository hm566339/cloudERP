package com.erp.workflow.entity;

import com.erp.workflow.common.entity.BaseEntity;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

/**
 * A stage within a workflow definition.
 * Stages are configuration-driven — not hardcoded.
 * Example stages: SUBMISSION, MANAGER_APPROVAL, FINANCE_APPROVAL, COMPLETED
 */
@Entity
@Table(name = "workflow_stage")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowStage extends BaseEntity {

    @Id
    @GeneratedValue
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workflow_definition_id", nullable = false)
    private WorkflowDefinition workflowDefinition;

    @Column(name = "stage_code", nullable = false, length = 100)
    private String stageCode;

    @Column(name = "stage_name")
    private String stageName;

    @Column(name = "stage_order")
    private Integer stageOrder;

    @Column(name = "sequence_no", nullable = false)
    private Integer sequenceNo;

    @Enumerated(EnumType.STRING)
    @Column(name = "execution_type", nullable = false, length = 50)
    private WorkflowExecutionType executionType = WorkflowExecutionType.SEQUENTIAL;

    @Column(name = "minimum_approvals_required", nullable = false)
    private Integer minimumApprovalsRequired = 1;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "rejection_action", nullable = false, length = 50)
    private WorkflowRejectionAction rejectionAction = WorkflowRejectionAction.REJECT_DOCUMENT;

    @Builder.Default
    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory = true;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @OneToMany(mappedBy = "workflowStage", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<WorkflowApprover> approvers;

    @OneToMany(mappedBy = "workflowStage", fetch = FetchType.LAZY)
    @JsonIgnore
    private List<WorkflowSla> slas;
}
