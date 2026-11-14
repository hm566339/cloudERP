package com.erp.workflow.dto.request;

import com.erp.workflow.enums.PlatformRolloutMode;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePlatformWorkflowTemplateRequest {

    private String templateName;
    private String moduleName;
    private String description;
    private Boolean isActive;
    private Boolean isDefault;
    private LocalDateTime effectiveFrom;
    private LocalDateTime effectiveTo;
    private String initiatedByRoleName;
    private String customerScope;
    private BigDecimal approvalThreshold;
    private Boolean isApprovalRequired;
    private Boolean customerAcceptance;
    private Boolean autoCreateOrder;
    private Boolean emailNotifications;
    private String internalNotes;

    @Builder.Default
    private Boolean createNewVersion = false;

    private PlatformRolloutMode rolloutMode;

    private List<CreatePlatformWorkflowTemplateRequest.StageRequest> stages;
    private List<CreatePlatformWorkflowTemplateRequest.TransitionRequest> transitions;
}

