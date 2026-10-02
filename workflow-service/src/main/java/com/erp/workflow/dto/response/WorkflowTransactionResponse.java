package com.erp.workflow.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTransactionResponse {

    private UUID id;
    private UUID companyId;
    private UUID workflowDefinitionId;
    private String workflowDefinitionName;
    private String moduleName;
    private String entityType;
    private UUID entityId;
    private String documentType;
    private UUID documentId;
    private String documentNumber;
    private String callbackUrl;
    private UUID currentStageId;
    private String currentStageName;
    private Integer currentStageSequence;
    private String status;
    private UUID initiatedBy;
    private String initiatedByName;
    private LocalDateTime initiatedAt;
    private LocalDateTime submittedAt;
    private LocalDateTime completedAt;
    private LocalDateTime cancelledAt;
    private Long version;
    private LocalDateTime createdAt;
    private List<WorkflowTaskResponse> tasks;
    private List<WorkflowActionResponse> actions;
}
