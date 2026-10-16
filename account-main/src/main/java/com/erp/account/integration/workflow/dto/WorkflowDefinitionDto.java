package com.erp.account.integration.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkflowDefinitionDto {

    private UUID id;
    private UUID companyId;
    private String workflowCode;
    private String workflowName;
    private String moduleName;
    private String documentType;
    private Boolean isActive;
    private Boolean isApprovalRequired;
    private Boolean customerAcceptance;
    private Boolean autoCreateOrder;
    private BigDecimal approvalThreshold;
}
