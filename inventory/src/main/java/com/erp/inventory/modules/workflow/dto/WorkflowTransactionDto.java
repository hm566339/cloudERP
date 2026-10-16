package com.erp.inventory.modules.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTransactionDto {
    private UUID id;
    private UUID companyId;
    private String moduleName;
    private String documentType;
    private UUID documentId;
    private String documentNumber;
    private String status;
    private UUID currentStepId;
    private String currentStepName;
    private UUID initiatedBy;
    private String initiatedByName;
    private LocalDateTime initiatedAt;
    private LocalDateTime completedAt;
    private String comments;
}
