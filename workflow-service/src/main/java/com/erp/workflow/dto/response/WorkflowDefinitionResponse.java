package com.erp.workflow.dto.response;

import com.erp.workflow.enums.ApproverType;
import com.erp.workflow.enums.WorkflowActionType;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowDefinitionResponse {

    private UUID id;
    private UUID companyId;
    private String workflowCode;
    private String workflowName;
    private String moduleName;
    private String documentType;
    private String description;
    private Integer version;
    private Boolean isActive;
    private Boolean isDefault;
    private LocalDateTime effectiveFrom;
    private LocalDateTime effectiveTo;
    private LocalDateTime createdAt;

    private UUID initiatedByRoleId;
    private String initiatedByRoleName;
    private String customerScope;
    private BigDecimal approvalThreshold;
    private Boolean isApprovalRequired;
    private Boolean customerAcceptance;
    private Boolean autoCreateOrder;
    private Boolean emailNotifications;
    private String internalNotes;

    private List<StageResponse> stages;
    private List<TransitionResponse> transitions;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StageResponse {
        private UUID id;
        private String stageCode;
        private String stageName;
        private Integer stageOrder;
        private Integer sequenceNo;
        private WorkflowExecutionType executionType;
        private Integer minimumApprovalsRequired;
        private WorkflowRejectionAction rejectionAction;
        private Boolean isMandatory;
        private Boolean isActive;
        private List<ApproverResponse> approvers;
        private SlaResponse sla;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ApproverResponse {
        private UUID id;
        private ApproverType approverType;
        private UUID userId;
        private String userName;
        private UUID roleId;
        private String roleName;
        private UUID departmentId;
        private String departmentName;
        private String ruleExpression;
        private Integer approvalOrder;
        private Boolean isRequired;
        private Boolean canDelegate;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TransitionResponse {
        private UUID id;
        private WorkflowActionType actionType;
        private UUID sourceStageId;
        private String sourceStageCode;
        private UUID targetStageId;
        private String targetStageCode;
        private String transitionCondition;
        private String allowedRoles;
        private Boolean isActive;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SlaResponse {
        private UUID id;
        private Integer durationHours;
        private Integer reminderHours;
        private String escalationAction;
        private UUID escalateToUserId;
        private String escalateToRoleName;
        private Boolean isActive;
    }
}
