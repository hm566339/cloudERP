package com.erp.inventory.modules.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowSubmitRequestDto {
    private UUID companyId;
    private String moduleName;
    private String entityType;
    private UUID entityId;
    private String documentType;
    private UUID documentId;
    private String documentNumber;
    private String callbackUrl;
    private UUID initiatedBy;
    private String initiatedByName;
    private String comments;
}
