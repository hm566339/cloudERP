package com.erp.workflow.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateOrgWorkflowTemplateRequest {

    private String templateCode;

    @NotBlank(message = "templateName is required")
    private String templateName;

    private String moduleName;
    private String documentType;
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

    /** If true, updates are also applied to companies that had customized their workflow */
    @Builder.Default
    private boolean forceUpdateCustomized = false;

    private List<CreateOrgWorkflowTemplateRequest.StageRequest> stages;
    private List<CreateOrgWorkflowTemplateRequest.TransitionRequest> transitions;
}

