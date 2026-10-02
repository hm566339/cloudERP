package com.erp.account.integration.workflow.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WorkflowSubmitRequestDto {

    private UUID companyId;
    private String moduleName; // "ACCOUNT"
    private String entityType; // e.g. "FISCAL_YEAR", "SALES_INVOICE", "AP_INVOICE"
    private UUID entityId;
    private String documentType;
    private UUID documentId;
    private String documentNumber;
    private UUID workflowDefinitionId;
    private String callbackUrl;
    private UUID initiatedBy;
    private String initiatedByName;
    private String comments;
    private Map<String, Object> metadata;
}
