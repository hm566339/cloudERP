package com.erp.workflow.dto.request;

import com.erp.workflow.enums.ApproverType;
import com.erp.workflow.enums.WorkflowActionType;
import com.erp.workflow.enums.WorkflowExecutionType;
import com.erp.workflow.enums.WorkflowRejectionAction;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class CreateOrgWorkflowTemplateRequest {

    private UUID organizationId;

    @NotBlank(message = "templateCode is required")
    private String templateCode;

    @NotBlank(message = "templateName is required")
    private String templateName;

    private String moduleName; // e.g. ACCOUNT, SALES, INVENTORY, PURCHASE

    @NotBlank(message = "documentType is required")
    private String documentType; // e.g. FISCAL_YEAR, QUOTATION, STOCK_ADJUSTMENT

    private String description;

    @Builder.Default
    private Integer version = 1;

    @Builder.Default
    private Boolean isActive = true;

    @Builder.Default
    private Boolean isDefault = true;

    private LocalDateTime effectiveFrom;
    private LocalDateTime effectiveTo;

    private String initiatedByRoleName;

    @Builder.Default
    private String customerScope = "all";

    private BigDecimal approvalThreshold;

    @Builder.Default
    private Boolean isApprovalRequired = true;

    @Builder.Default
    private Boolean customerAcceptance = false;

    @Builder.Default
    private Boolean autoCreateOrder = false;

    @Builder.Default
    private Boolean emailNotifications = true;

    private String internalNotes;

    /** Optional initial target companies to provision to immediately upon creation */
    private List<UUID> targetCompanyIds;

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

        /** Role name or code (e.g. "Accountant", "Finance Manager") — NEVER company-specific UUID */
        private String roleName;

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
        private String escalateToRoleName;
    }
}

