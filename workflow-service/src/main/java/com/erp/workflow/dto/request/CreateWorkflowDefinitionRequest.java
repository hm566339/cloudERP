package com.erp.workflow.dto.request;

import com.erp.workflow.enums.ApproverType;
import com.erp.workflow.enums.WorkflowActionType;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateWorkflowDefinitionRequest {

    @NotNull(message = "companyId is required")
    private UUID companyId;

    @NotBlank(message = "workflowCode is required")
    private String workflowCode;

    @NotBlank(message = "workflowName is required")
    private String workflowName;

    private String moduleName; // e.g. ACCOUNT, INVENTORY, CRM, PURCHASE, SALES

    @NotBlank(message = "documentType is required")
    private String documentType; // e.g. FISCAL_YEAR, STOCK_ADJUSTMENT, PURCHASE_ORDER

    private String description;
    private Integer version = 1;
    private Boolean isActive = true;
    private Boolean isDefault = false;
    private LocalDateTime effectiveFrom;
    private LocalDateTime effectiveTo;

    @NotEmpty(message = "At least one stage is required")
    private List<StageRequest> stages;

    private List<TransitionRequest> transitions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StageRequest {
        @NotBlank(message = "stageCode is required")
        private String stageCode;

        @NotBlank(message = "stageName is required")
        private String stageName;

        private Integer stageOrder;
        private Integer sequenceNo;
        private WorkflowExecutionType executionType = WorkflowExecutionType.SEQUENTIAL;
        private Integer minimumApprovalsRequired = 1;
        private WorkflowRejectionAction rejectionAction = WorkflowRejectionAction.REJECT_DOCUMENT;
        private Boolean isMandatory = true;
        @Builder.Default
        private Boolean isActive = true;

        private List<ApproverRequest> approvers;
        private SlaRequest sla;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApproverRequest {
        @NotNull(message = "approverType is required")
        private ApproverType approverType;

        private UUID userId;
        private String userName;
        private UUID roleId;
        private String roleName;
        private UUID departmentId;
        private String departmentName;
        private String ruleExpression;
        private Integer approvalOrder = 1;
        private Boolean isRequired = true;
        private Boolean canDelegate = true;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransitionRequest {
        @NotNull(message = "actionType is required")
        private WorkflowActionType actionType;

        private String sourceStageCode;
        private String targetStageCode;
        private String transitionCondition;
        private String allowedRoles;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SlaRequest {
        @NotNull(message = "durationHours is required")
        private Integer durationHours;
        private Integer reminderHours;
        private String escalationAction = "NOTIFY_MANAGER";
        private UUID escalateToUserId;
        private String escalateToRoleName;
    }
}
