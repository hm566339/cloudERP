package com.erp.workflow.callback;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkflowCallbackPayload {

    private UUID transactionId;
    private UUID companyId;
    private String moduleName;
    private String entityType;
    private UUID entityId;
    private String documentType;
    private UUID documentId;
    private String documentNumber;
    private String eventType; // WORKFLOW_APPROVED, WORKFLOW_REJECTED, WORKFLOW_CANCELLED, WORKFLOW_STAGE_CHANGED
    private String status;
    private String stageCode;
    private String stageName;
    private UUID actionByUserId;
    private String actionByUserName;
    private String comments;
    private LocalDateTime timestamp;
    private Map<String, Object> metadata;
}
