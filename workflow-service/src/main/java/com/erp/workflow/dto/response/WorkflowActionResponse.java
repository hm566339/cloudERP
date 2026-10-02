package com.erp.workflow.dto.response;

import com.erp.workflow.enums.WorkflowActionType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowActionResponse {

    private UUID id;
    private UUID workflowTransactionId;
    private UUID workflowTaskId;
    private WorkflowActionType actionType;
    private UUID performedBy;
    private String performedByName;
    private String previousStatus;
    private String newStatus;
    private String comments;
    private LocalDateTime createdAt;
}
