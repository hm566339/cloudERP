package com.erp.workflow.dto.response;

import com.erp.workflow.enums.WorkflowTaskStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowTaskResponse {

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
    private WorkflowTaskStatus taskStatus;
    private String actionTaken;
    private LocalDateTime assignedAt;
    private LocalDateTime dueAt;
    private LocalDateTime completedAt;
    private UUID completedBy;
    private String completedByName;
    private String comments;
    private Long version;
}
