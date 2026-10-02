package com.erp.account.integration.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class WorkflowTaskDto {

    private UUID id;
    private UUID workflowTransactionId;
    private String documentType;
    private String documentNumber;
    private UUID workflowStageId;
    private String stageName;
    private Integer stageSequence;
    private UUID assignedUserId;
    private String assignedRoleName;
    private UUID delegatedFromUserId;
    private String taskStatus;
    private String actionTaken;
    private LocalDateTime assignedAt;
    private LocalDateTime dueAt;
    private LocalDateTime completedAt;
    private UUID completedBy;
    private String completedByName;
    private String comments;
    private Long version;
}
